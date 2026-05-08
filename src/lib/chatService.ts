/**
 * Orchestrates a chat turn: assembles messages for the active conversation,
 * creates the active provider, streams the response into the chat store,
 * and handles abort/error paths. Also exposes regenerate + editAndResubmit.
 */

import { createProvider, type ChatMessage } from "@/lib/providers";
import { getSecret } from "@/lib/keystore";
import { useChatStore, type Conversation } from "@/stores/chat";
import { useProviderStore } from "@/stores/providers";

export interface SendMessageInput {
  content: string;
}

function cryptoRandomId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `id_${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`;
}

function ensureActiveConversation(): string {
  const store = useChatStore.getState();
  if (store.activeId && store.conversations[store.activeId]) {
    return store.activeId;
  }
  return store.newConversation();
}

function resolveParams(conv: Conversation | undefined) {
  const s = useChatStore.getState();
  return {
    systemPrompt: conv?.systemPrompt ?? s.defaultSystemPrompt,
    temperature: conv?.temperature ?? s.defaultTemperature,
    topP: conv?.topP ?? s.defaultTopP,
    maxTokens: conv?.maxTokens ?? s.defaultMaxTokens,
  };
}

/**
 * Low-level stream runner. Assumes the chat store already has a pending
 * assistant turn appended as the last message of the active conversation.
 */
async function runStreamingTurn(opts: {
  providerId: string;
  model: string;
  apiKey: string;
  messages: ChatMessage[];
  temperature: number;
  topP: number;
  maxTokens: number;
}): Promise<void> {
  const providerStore = useProviderStore.getState();
  const chatStore = useChatStore.getState();
  const config = providerStore.configs[opts.providerId as keyof typeof providerStore.configs];
  if (!config) {
    throw new Error(`Unknown provider "${opts.providerId}"`);
  }
  const provider = createProvider(config);

  const controller = new AbortController();
  chatStore.setStreaming(true, controller);

  try {
    const stream = provider.chatStream(opts.apiKey, {
      model: opts.model,
      messages: opts.messages,
      temperature: opts.temperature,
      topP: opts.topP,
      maxTokens: opts.maxTokens,
      signal: controller.signal,
    });

    for await (const chunk of stream) {
      if (chunk.delta) useChatStore.getState().appendToLast(chunk.delta);
      if (chunk.finishReason) {
        useChatStore.getState().finalizeLast({
          modelRef: { provider: opts.providerId, model: opts.model },
        });
      }
    }
    useChatStore.getState().finalizeLast();
  } catch (err) {
    const msg =
      err instanceof Error
        ? err.name === "AbortError"
          ? "Cancelled"
          : err.message
        : "Unknown error";
    useChatStore.getState().markLastError(msg);
    if (!(err instanceof Error && err.name === "AbortError")) throw err;
  } finally {
    useChatStore.getState().setStreaming(false, null);
  }
}

/**
 * Send a fresh user message in the active conversation and stream the
 * assistant reply. Creates a conversation if none exists.
 */
export async function sendChatMessage({
  content,
}: SendMessageInput): Promise<void> {
  const trimmed = content.trim();
  if (!trimmed) return;

  const providerStore = useProviderStore.getState();
  const activeProviderId = providerStore.activeProvider;
  const config = providerStore.configs[activeProviderId];
  const model = providerStore.activeModel || config.defaultModel;

  if (!config.baseUrl) {
    throw new Error(
      `Provider "${config.label}" has no base URL. Configure it in Providers.`,
    );
  }
  const apiKey = await getSecret(config.apiKeyAlias);
  if (!apiKey) {
    throw new Error(
      `No API key saved for "${config.label}". Add one in Providers.`,
    );
  }

  const convId = ensureActiveConversation();
  const chatStore = useChatStore.getState();
  const now = Date.now();

  // Append the user turn + a pending assistant turn.
  chatStore.addMessage({
    id: cryptoRandomId(),
    role: "user",
    content: trimmed,
    createdAt: now,
  });
  chatStore.addMessage({
    id: cryptoRandomId(),
    role: "assistant",
    content: "",
    createdAt: now + 1,
    pending: true,
    modelRef: { provider: activeProviderId, model },
  });

  // Snapshot after addMessage so the streaming reads the latest messages.
  const conv = useChatStore.getState().conversations[convId];
  const params = resolveParams(conv);
  const messages: ChatMessage[] = [
    { role: "system", content: params.systemPrompt },
    ...conv.messages.slice(0, -1).map((t) => ({
      role: t.role,
      content: t.content,
    })),
  ];

  await runStreamingTurn({
    providerId: activeProviderId,
    model,
    apiKey,
    messages,
    temperature: params.temperature,
    topP: params.topP,
    maxTokens: params.maxTokens,
  });
}

/**
 * Re-run the last turn: drop the trailing assistant message (if any) and
 * stream a new response using the same user prompt.
 */
export async function regenerateLastTurn(): Promise<void> {
  const chatStore = useChatStore.getState();
  const convId = chatStore.activeId;
  if (!convId) return;
  const conv = chatStore.conversations[convId];
  if (!conv || conv.messages.length === 0) return;
  if (conv.messages[conv.messages.length - 1].role === "assistant") {
    chatStore.truncateTrailing();
  }

  const providerStore = useProviderStore.getState();
  const activeProviderId = providerStore.activeProvider;
  const config = providerStore.configs[activeProviderId];
  const model = providerStore.activeModel || config.defaultModel;
  const apiKey = await getSecret(config.apiKeyAlias);
  if (!apiKey) throw new Error(`No API key for "${config.label}".`);

  const now = Date.now();
  chatStore.addMessage({
    id: cryptoRandomId(),
    role: "assistant",
    content: "",
    createdAt: now,
    pending: true,
    modelRef: { provider: activeProviderId, model },
  });

  const fresh = useChatStore.getState().conversations[convId];
  const params = resolveParams(fresh);
  const messages: ChatMessage[] = [
    { role: "system", content: params.systemPrompt },
    ...fresh.messages.slice(0, -1).map((t) => ({
      role: t.role,
      content: t.content,
    })),
  ];

  await runStreamingTurn({
    providerId: activeProviderId,
    model,
    apiKey,
    messages,
    temperature: params.temperature,
    topP: params.topP,
    maxTokens: params.maxTokens,
  });
}

/**
 * Edit a previous user message, truncate everything after it, and re-stream
 * a fresh assistant reply.
 */
export async function editAndResubmit(
  turnId: string,
  newContent: string,
): Promise<void> {
  const trimmed = newContent.trim();
  if (!trimmed) return;
  const chatStore = useChatStore.getState();
  const convId = chatStore.activeId;
  if (!convId) return;
  const conv = chatStore.conversations[convId];
  if (!conv) return;
  const idx = conv.messages.findIndex((m) => m.id === turnId);
  if (idx === -1) return;
  if (conv.messages[idx].role !== "user") return;

  // Replace content and drop trailing messages after it.
  chatStore.editUserMessage(turnId, trimmed);
  const trailingId = conv.messages[idx + 1]?.id;
  if (trailingId) chatStore.removeMessagesFrom(trailingId);

  const providerStore = useProviderStore.getState();
  const activeProviderId = providerStore.activeProvider;
  const config = providerStore.configs[activeProviderId];
  const model = providerStore.activeModel || config.defaultModel;
  const apiKey = await getSecret(config.apiKeyAlias);
  if (!apiKey) throw new Error(`No API key for "${config.label}".`);

  const now = Date.now();
  chatStore.addMessage({
    id: cryptoRandomId(),
    role: "assistant",
    content: "",
    createdAt: now,
    pending: true,
    modelRef: { provider: activeProviderId, model },
  });

  const fresh = useChatStore.getState().conversations[convId];
  const params = resolveParams(fresh);
  const messages: ChatMessage[] = [
    { role: "system", content: params.systemPrompt },
    ...fresh.messages.slice(0, -1).map((t) => ({
      role: t.role,
      content: t.content,
    })),
  ];

  await runStreamingTurn({
    providerId: activeProviderId,
    model,
    apiKey,
    messages,
    temperature: params.temperature,
    topP: params.topP,
    maxTokens: params.maxTokens,
  });
}
