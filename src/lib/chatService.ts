/**
 * Orchestrates a chat turn: assembles messages, creates the active provider,
 * streams the response into the chat store, and handles abort/error paths.
 */

import { createProvider, type ChatMessage } from "@/lib/providers";
import { getSecret } from "@/lib/keystore";
import { useChatStore } from "@/stores/chat";
import { useProviderStore } from "@/stores/providers";

export interface SendMessageInput {
  content: string;
}

export async function sendChatMessage({
  content,
}: SendMessageInput): Promise<void> {
  const providerStore = useProviderStore.getState();
  const chatStore = useChatStore.getState();

  const activeId = providerStore.activeProvider;
  const config = providerStore.configs[activeId];
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

  // Build the user + assistant turns on the store synchronously.
  const userTurnId = cryptoRandomId();
  const assistantTurnId = cryptoRandomId();
  const now = Date.now();

  chatStore.addMessage({
    id: userTurnId,
    role: "user",
    content: content.trim(),
    createdAt: now,
  });
  chatStore.addMessage({
    id: assistantTurnId,
    role: "assistant",
    content: "",
    createdAt: now + 1,
    pending: true,
    modelRef: { provider: activeId, model },
  });

  const messages: ChatMessage[] = [
    { role: "system", content: chatStore.systemPrompt },
    ...useChatStore
      .getState()
      .messages.slice(0, -1) // drop the empty pending assistant turn
      .map((t) => ({
        role: t.role,
        content: t.content,
      })),
  ];

  const controller = new AbortController();
  chatStore.setStreaming(true, controller);

  try {
    const provider = createProvider(config);
    const stream = provider.chatStream(apiKey, {
      model,
      messages,
      temperature: chatStore.temperature,
      topP: chatStore.topP,
      maxTokens: chatStore.maxTokens,
      signal: controller.signal,
    });

    for await (const chunk of stream) {
      if (chunk.delta) useChatStore.getState().appendToLast(chunk.delta);
      if (chunk.finishReason) {
        useChatStore.getState().finalizeLast({ modelRef: { provider: activeId, model } });
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
    throw err instanceof Error && err.name === "AbortError" ? undefined : err;
  } finally {
    useChatStore.getState().setStreaming(false, null);
  }
}

function cryptoRandomId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `id_${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`;
}
