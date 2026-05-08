import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { ChatMessage } from "@/lib/providers";

export interface ChatTurn extends ChatMessage {
  id: string;
  createdAt: number;
  /** True while the assistant is streaming this message. */
  pending?: boolean;
  /** Optional error associated with this turn. */
  error?: string;
  /** Model id + provider id used to generate this turn. */
  modelRef?: { provider: string; model: string };
}

export interface Conversation {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  pinned?: boolean;
  messages: ChatTurn[];
  /** Per-conversation override of the default parameters. */
  systemPrompt?: string;
  temperature?: number;
  topP?: number;
  maxTokens?: number;
  /** Provider + model used for the most recent turn, for display. */
  lastModelRef?: { provider: string; model: string };
}

const DEFAULT_SYSTEM =
  "You are a creative assistant for microstock video creators. " +
  "Be concise, practical, and respond in the user's language.";

export interface ChatState {
  /** Map of conversation id -> conversation. */
  conversations: Record<string, Conversation>;
  /** Ordering of conversations (pinned first, then by updatedAt desc). */
  order: string[];
  /** Currently active conversation id (null if none exists). */
  activeId: string | null;

  /** Default sampling + system prompt. Used when a conversation does not override. */
  defaultSystemPrompt: string;
  defaultTemperature: number;
  defaultTopP: number;
  defaultMaxTokens: number;

  /** Transient flags kept outside the persisted payload. */
  isStreaming: boolean;
  abortController: AbortController | null;

  /* ---------- conversation CRUD ---------- */
  newConversation: () => string;
  deleteConversation: (id: string) => void;
  renameConversation: (id: string, title: string) => void;
  togglePin: (id: string) => void;
  setActive: (id: string) => void;
  clearAll: () => void;

  /* ---------- per-conversation settings ---------- */
  setConversationParam: <K extends "systemPrompt" | "temperature" | "topP" | "maxTokens">(
    id: string,
    key: K,
    value: Conversation[K],
  ) => void;

  /* ---------- default settings ---------- */
  setDefaultSystemPrompt: (v: string) => void;
  setDefaultTemperature: (v: number) => void;
  setDefaultTopP: (v: number) => void;
  setDefaultMaxTokens: (v: number) => void;

  /* ---------- message operations (all act on active conversation) ---------- */
  addMessage: (turn: ChatTurn) => void;
  appendToLast: (delta: string) => void;
  finalizeLast: (patch?: Partial<ChatTurn>) => void;
  markLastError: (message: string) => void;
  editUserMessage: (turnId: string, newContent: string) => void;
  removeMessagesFrom: (turnId: string) => void;
  truncateTrailing: () => void;

  /* ---------- streaming ---------- */
  setStreaming: (isStreaming: boolean, controller?: AbortController | null) => void;
  abort: () => void;
}

function newId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `id_${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`;
}

function reorder(state: Pick<ChatState, "conversations" | "order">): string[] {
  const ids = Object.keys(state.conversations);
  ids.sort((a, b) => {
    const ca = state.conversations[a];
    const cb = state.conversations[b];
    if ((cb.pinned ? 1 : 0) - (ca.pinned ? 1 : 0) !== 0) {
      return (cb.pinned ? 1 : 0) - (ca.pinned ? 1 : 0);
    }
    return cb.updatedAt - ca.updatedAt;
  });
  return ids;
}

function mutateActive(
  state: ChatState,
  mutator: (conv: Conversation) => Conversation | null,
): Partial<ChatState> {
  if (!state.activeId) return {};
  const current = state.conversations[state.activeId];
  if (!current) return {};
  const next = mutator(current);
  if (next === null) return {};
  next.updatedAt = Date.now();
  const conversations = { ...state.conversations, [next.id]: next };
  return { conversations, order: reorder({ conversations, order: state.order }) };
}

export const useChatStore = create<ChatState>()(
  persist(
    (set, get) => ({
      conversations: {},
      order: [],
      activeId: null,

      defaultSystemPrompt: DEFAULT_SYSTEM,
      defaultTemperature: 0.7,
      defaultTopP: 1,
      defaultMaxTokens: 2048,

      isStreaming: false,
      abortController: null,

      /* ------- conversation CRUD ------- */
      newConversation: () => {
        const id = newId();
        const now = Date.now();
        const conv: Conversation = {
          id,
          title: "New chat",
          createdAt: now,
          updatedAt: now,
          messages: [],
        };
        set((s) => {
          const conversations = { ...s.conversations, [id]: conv };
          return {
            conversations,
            order: reorder({ conversations, order: s.order }),
            activeId: id,
          };
        });
        return id;
      },

      deleteConversation: (id) =>
        set((s) => {
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const { [id]: _removed, ...rest } = s.conversations;
          const order = reorder({ conversations: rest, order: s.order });
          return {
            conversations: rest,
            order,
            activeId: s.activeId === id ? order[0] ?? null : s.activeId,
          };
        }),

      renameConversation: (id, title) =>
        set((s) => {
          const conv = s.conversations[id];
          if (!conv) return s;
          const next = { ...conv, title, updatedAt: Date.now() };
          const conversations = { ...s.conversations, [id]: next };
          return {
            conversations,
            order: reorder({ conversations, order: s.order }),
          };
        }),

      togglePin: (id) =>
        set((s) => {
          const conv = s.conversations[id];
          if (!conv) return s;
          const next = { ...conv, pinned: !conv.pinned, updatedAt: Date.now() };
          const conversations = { ...s.conversations, [id]: next };
          return {
            conversations,
            order: reorder({ conversations, order: s.order }),
          };
        }),

      setActive: (id) => set({ activeId: id }),

      clearAll: () =>
        set({ conversations: {}, order: [], activeId: null }),

      /* ------- per-conversation settings ------- */
      setConversationParam: (id, key, value) =>
        set((s) => {
          const conv = s.conversations[id];
          if (!conv) return s;
          const next = { ...conv, [key]: value, updatedAt: Date.now() };
          const conversations = { ...s.conversations, [id]: next };
          return {
            conversations,
            order: reorder({ conversations, order: s.order }),
          };
        }),

      /* ------- defaults ------- */
      setDefaultSystemPrompt: (defaultSystemPrompt) => set({ defaultSystemPrompt }),
      setDefaultTemperature: (defaultTemperature) => set({ defaultTemperature }),
      setDefaultTopP: (defaultTopP) => set({ defaultTopP }),
      setDefaultMaxTokens: (defaultMaxTokens) => set({ defaultMaxTokens }),

      /* ------- message ops (on active conversation) ------- */
      addMessage: (turn) =>
        set((s) =>
          mutateActive(s, (conv) => ({
            ...conv,
            messages: [...conv.messages, turn],
            // Auto-title from the first user message.
            title:
              conv.title === "New chat" && turn.role === "user"
                ? turn.content.slice(0, 60).trim() || conv.title
                : conv.title,
            lastModelRef: turn.modelRef ?? conv.lastModelRef,
          })),
        ),

      appendToLast: (delta) =>
        set((s) =>
          mutateActive(s, (conv) => {
            if (conv.messages.length === 0) return null;
            const msgs = conv.messages.slice();
            const last = msgs[msgs.length - 1];
            msgs[msgs.length - 1] = { ...last, content: last.content + delta };
            return { ...conv, messages: msgs };
          }),
        ),

      finalizeLast: (patch) =>
        set((s) =>
          mutateActive(s, (conv) => {
            if (conv.messages.length === 0) return null;
            const msgs = conv.messages.slice();
            const last = msgs[msgs.length - 1];
            const next = { ...last, pending: false, ...patch };
            msgs[msgs.length - 1] = next;
            return {
              ...conv,
              messages: msgs,
              lastModelRef: next.modelRef ?? conv.lastModelRef,
            };
          }),
        ),

      markLastError: (message) =>
        set((s) =>
          mutateActive(s, (conv) => {
            if (conv.messages.length === 0) return null;
            const msgs = conv.messages.slice();
            const last = msgs[msgs.length - 1];
            msgs[msgs.length - 1] = { ...last, pending: false, error: message };
            return { ...conv, messages: msgs };
          }),
        ),

      editUserMessage: (turnId, newContent) =>
        set((s) =>
          mutateActive(s, (conv) => {
            const idx = conv.messages.findIndex((m) => m.id === turnId);
            if (idx === -1) return null;
            const msg = conv.messages[idx];
            if (msg.role !== "user") return null;
            const msgs = conv.messages
              .slice(0, idx + 1)
              .map((m, i) =>
                i === idx ? { ...m, content: newContent } : m,
              );
            return { ...conv, messages: msgs };
          }),
        ),

      removeMessagesFrom: (turnId) =>
        set((s) =>
          mutateActive(s, (conv) => {
            const idx = conv.messages.findIndex((m) => m.id === turnId);
            if (idx === -1) return null;
            return { ...conv, messages: conv.messages.slice(0, idx) };
          }),
        ),

      truncateTrailing: () =>
        set((s) =>
          mutateActive(s, (conv) => {
            if (conv.messages.length === 0) return null;
            return { ...conv, messages: conv.messages.slice(0, -1) };
          }),
        ),

      /* ------- streaming ------- */
      setStreaming: (isStreaming, controller = null) =>
        set({ isStreaming, abortController: controller }),

      abort: () => {
        const c = get().abortController;
        if (c) c.abort();
        set({ isStreaming: false, abortController: null });
      },
    }),
    {
      name: "rstm:chat",
      version: 2,
      storage: createJSONStorage(() => localStorage),
      // Persist everything except transient streaming state.
      partialize: (s) => ({
        conversations: s.conversations,
        order: s.order,
        activeId: s.activeId,
        defaultSystemPrompt: s.defaultSystemPrompt,
        defaultTemperature: s.defaultTemperature,
        defaultTopP: s.defaultTopP,
        defaultMaxTokens: s.defaultMaxTokens,
      }),
      // Migrate v1 -> v2 (v1 had a flat list of messages; we drop it safely).
      migrate: (state) => {
        const anyState = state as Partial<ChatState> & { messages?: unknown };
        return {
          ...anyState,
          messages: undefined,
          conversations: anyState.conversations ?? {},
          order: anyState.order ?? [],
          activeId: anyState.activeId ?? null,
        } as ChatState;
      },
    },
  ),
);

/* -------------------------------------------------------------------------- */
/* Selectors                                                                   */
/* -------------------------------------------------------------------------- */

export function useActiveConversation(): Conversation | null {
  return useChatStore((s) => (s.activeId ? s.conversations[s.activeId] ?? null : null));
}

export function useConversationParams(): {
  systemPrompt: string;
  temperature: number;
  topP: number;
  maxTokens: number;
} {
  return useChatStore((s) => {
    const conv = s.activeId ? s.conversations[s.activeId] : null;
    return {
      systemPrompt: conv?.systemPrompt ?? s.defaultSystemPrompt,
      temperature: conv?.temperature ?? s.defaultTemperature,
      topP: conv?.topP ?? s.defaultTopP,
      maxTokens: conv?.maxTokens ?? s.defaultMaxTokens,
    };
  });
}
