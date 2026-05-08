import { create } from "zustand";
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

export interface ChatState {
  messages: ChatTurn[];
  systemPrompt: string;
  temperature: number;
  topP: number;
  maxTokens: number;
  isStreaming: boolean;
  abortController: AbortController | null;

  setSystemPrompt: (v: string) => void;
  setTemperature: (v: number) => void;
  setTopP: (v: number) => void;
  setMaxTokens: (v: number) => void;

  addMessage: (turn: ChatTurn) => void;
  appendToLast: (delta: string) => void;
  finalizeLast: (patch?: Partial<ChatTurn>) => void;
  markLastError: (message: string) => void;
  clear: () => void;

  setStreaming: (isStreaming: boolean, controller?: AbortController | null) => void;
  abort: () => void;
}

const DEFAULT_SYSTEM =
  "You are a creative assistant for microstock video creators. " +
  "Be concise, practical, and respond in the user's language.";

export const useChatStore = create<ChatState>((set, get) => ({
  messages: [],
  systemPrompt: DEFAULT_SYSTEM,
  temperature: 0.7,
  topP: 1,
  maxTokens: 2048,
  isStreaming: false,
  abortController: null,

  setSystemPrompt: (systemPrompt) => set({ systemPrompt }),
  setTemperature: (temperature) => set({ temperature }),
  setTopP: (topP) => set({ topP }),
  setMaxTokens: (maxTokens) => set({ maxTokens }),

  addMessage: (turn) =>
    set((s) => ({ messages: [...s.messages, turn] })),

  appendToLast: (delta) =>
    set((s) => {
      if (s.messages.length === 0) return s;
      const msgs = s.messages.slice();
      const last = msgs[msgs.length - 1];
      msgs[msgs.length - 1] = { ...last, content: last.content + delta };
      return { messages: msgs };
    }),

  finalizeLast: (patch) =>
    set((s) => {
      if (s.messages.length === 0) return s;
      const msgs = s.messages.slice();
      const last = msgs[msgs.length - 1];
      msgs[msgs.length - 1] = { ...last, pending: false, ...patch };
      return { messages: msgs };
    }),

  markLastError: (message) =>
    set((s) => {
      if (s.messages.length === 0) return s;
      const msgs = s.messages.slice();
      const last = msgs[msgs.length - 1];
      msgs[msgs.length - 1] = { ...last, pending: false, error: message };
      return { messages: msgs };
    }),

  clear: () => set({ messages: [] }),

  setStreaming: (isStreaming, controller = null) =>
    set({ isStreaming, abortController: controller }),

  abort: () => {
    const c = get().abortController;
    if (c) c.abort();
    set({ isStreaming: false, abortController: null });
  },
}));
