/**
 * Unified AI provider interface. Every concrete provider (OpenAI, Mistral,
 * OpenRouter, Custom) speaks the OpenAI-compatible Chat Completions wire
 * format, so only the base URL, API key and model catalog differ.
 */

export type ProviderId = "openai" | "mistral" | "openrouter" | "custom";

export interface AIProviderConfig {
  id: ProviderId;
  label: string;
  /** Root URL ending in /v1 (no trailing slash). */
  baseUrl: string;
  /** Reference key in the Windows Credential Manager; not the plaintext secret. */
  apiKeyAlias: string;
  defaultModel: string;
  /** Optional extra headers (e.g. OpenRouter HTTP-Referer / X-Title). */
  headers?: Record<string, string>;
  /** Whether the provider supports listing models via GET /models. */
  supportsListModels?: boolean;
}

export interface ChatMessage {
  role: "system" | "user" | "assistant" | "tool";
  content: string;
  name?: string;
}

export interface ChatParams {
  model: string;
  messages: ChatMessage[];
  temperature?: number;
  topP?: number;
  maxTokens?: number;
  /** Abort controller signal for cancellation. */
  signal?: AbortSignal;
  /** Extra body fields merged verbatim (e.g. response_format). */
  extra?: Record<string, unknown>;
}

export interface ChatChunk {
  /** New token text for this delta. Empty string if only finishReason arrived. */
  delta: string;
  finishReason?: "stop" | "length" | "content_filter" | "tool_calls" | null;
  /** Optional usage stats on the final chunk (provider dependent). */
  usage?: {
    promptTokens?: number;
    completionTokens?: number;
    totalTokens?: number;
  };
}

export interface ModelInfo {
  id: string;
  label?: string;
  /** Provider-specific metadata passthrough. */
  meta?: Record<string, unknown>;
}

export interface TestResult {
  ok: boolean;
  latencyMs: number;
  message?: string;
}

export interface AIProvider {
  config: AIProviderConfig;
  /** Retrieve available models; may be empty for providers without /models. */
  listModels(apiKey: string, signal?: AbortSignal): Promise<ModelInfo[]>;
  /** Open a streaming chat completion. Caller consumes via for-await. */
  chatStream(
    apiKey: string,
    params: ChatParams,
  ): AsyncIterable<ChatChunk>;
  /** Lightweight health check (usually GET /models with small timeout). */
  testConnection(apiKey: string): Promise<TestResult>;
}

/** Default configs bundled with the app. Users can override in Providers page. */
export const DEFAULT_PROVIDER_CONFIGS: Record<ProviderId, AIProviderConfig> = {
  openai: {
    id: "openai",
    label: "OpenAI",
    baseUrl: "https://api.openai.com/v1",
    apiKeyAlias: "rstm.provider.openai.apiKey",
    defaultModel: "gpt-4o-mini",
    supportsListModels: true,
  },
  mistral: {
    id: "mistral",
    label: "Mistral",
    baseUrl: "https://api.mistral.ai/v1",
    apiKeyAlias: "rstm.provider.mistral.apiKey",
    defaultModel: "mistral-large-latest",
    supportsListModels: true,
  },
  openrouter: {
    id: "openrouter",
    label: "OpenRouter",
    baseUrl: "https://openrouter.ai/api/v1",
    apiKeyAlias: "rstm.provider.openrouter.apiKey",
    defaultModel: "openrouter/auto",
    supportsListModels: true,
    headers: {
      // Identifying headers recommended by OpenRouter.
      "HTTP-Referer": "https://remotionstudiotools.microstock.local",
      "X-Title": "Remotion Studio Tools Microstock",
    },
  },
  custom: {
    id: "custom",
    label: "Custom",
    baseUrl: "",
    apiKeyAlias: "rstm.provider.custom.apiKey",
    defaultModel: "",
    supportsListModels: true,
  },
};
