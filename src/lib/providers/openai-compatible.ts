/**
 * Shared OpenAI-compatible transport. OpenAI, Mistral, OpenRouter and any
 * user-defined Custom endpoint all implement the same POST /chat/completions
 * + SSE streaming shape, so we centralize it here.
 */

import { sseIterator } from "@/lib/sse";
import type {
  AIProvider,
  AIProviderConfig,
  ChatChunk,
  ChatParams,
  ModelInfo,
  TestResult,
} from "./base";

interface OpenAIStreamChunk {
  id?: string;
  choices?: Array<{
    delta?: { content?: string; role?: string };
    finish_reason?:
      | "stop"
      | "length"
      | "content_filter"
      | "tool_calls"
      | null;
  }>;
  usage?: {
    prompt_tokens?: number;
    completion_tokens?: number;
    total_tokens?: number;
  };
}

export function createOpenAICompatibleProvider(
  config: AIProviderConfig,
): AIProvider {
  const endpoint = (path: string) => `${config.baseUrl.replace(/\/$/, "")}${path}`;

  const authHeaders = (apiKey: string): Record<string, string> => ({
    "Content-Type": "application/json",
    Authorization: `Bearer ${apiKey}`,
    ...(config.headers ?? {}),
  });

  return {
    config,

    async listModels(apiKey, signal) {
      if (!config.supportsListModels || !config.baseUrl) return [];
      const res = await fetch(endpoint("/models"), {
        method: "GET",
        headers: authHeaders(apiKey),
        signal,
      });
      if (!res.ok) {
        throw new Error(
          `listModels failed: ${res.status} ${res.statusText}`,
        );
      }
      const body = (await res.json()) as {
        data?: Array<{ id: string } & Record<string, unknown>>;
      };
      const models: ModelInfo[] = (body.data ?? []).map((m) => ({
        id: m.id,
        meta: m,
      }));
      return models;
    },

    async testConnection(apiKey): Promise<TestResult> {
      if (!config.baseUrl) {
        return {
          ok: false,
          latencyMs: 0,
          message: "Base URL is empty. Configure it in Providers.",
        };
      }
      const started = performance.now();
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 8000);
      try {
        const res = await fetch(endpoint("/models"), {
          method: "GET",
          headers: authHeaders(apiKey),
          signal: controller.signal,
        });
        const latencyMs = Math.round(performance.now() - started);
        if (!res.ok) {
          return {
            ok: false,
            latencyMs,
            message: `HTTP ${res.status} ${res.statusText}`,
          };
        }
        return { ok: true, latencyMs, message: "Connected" };
      } catch (err) {
        return {
          ok: false,
          latencyMs: Math.round(performance.now() - started),
          message: err instanceof Error ? err.message : "Network error",
        };
      } finally {
        clearTimeout(timer);
      }
    },

    async *chatStream(
      apiKey: string,
      params: ChatParams,
    ): AsyncIterable<ChatChunk> {
      if (!config.baseUrl) {
        throw new Error(
          `Provider "${config.label}" has no base URL configured.`,
        );
      }
      const body: Record<string, unknown> = {
        model: params.model,
        messages: params.messages,
        stream: true,
        ...(params.temperature !== undefined && {
          temperature: params.temperature,
        }),
        ...(params.topP !== undefined && { top_p: params.topP }),
        ...(params.maxTokens !== undefined && {
          max_tokens: params.maxTokens,
        }),
        ...(params.extra ?? {}),
      };

      const res = await fetch(endpoint("/chat/completions"), {
        method: "POST",
        headers: {
          ...authHeaders(apiKey),
          Accept: "text/event-stream",
        },
        body: JSON.stringify(body),
        signal: params.signal,
      });

      if (!res.ok) {
        // Try to surface API-returned error message if available.
        let detail = `${res.status} ${res.statusText}`;
        try {
          const errBody = (await res.json()) as {
            error?: { message?: string };
          };
          if (errBody.error?.message) detail = errBody.error.message;
        } catch {
          /* ignore parse failures */
        }
        throw new Error(`Chat request failed: ${detail}`);
      }

      for await (const event of sseIterator(res.body)) {
        if (event.data === "[DONE]") return;
        let parsed: OpenAIStreamChunk;
        try {
          parsed = JSON.parse(event.data) as OpenAIStreamChunk;
        } catch {
          continue;
        }
        const choice = parsed.choices?.[0];
        if (!choice) continue;
        const delta = choice.delta?.content ?? "";
        const finishReason = choice.finish_reason ?? undefined;
        const usage = parsed.usage
          ? {
              promptTokens: parsed.usage.prompt_tokens,
              completionTokens: parsed.usage.completion_tokens,
              totalTokens: parsed.usage.total_tokens,
            }
          : undefined;
        if (delta || finishReason !== undefined || usage) {
          yield { delta, finishReason, usage };
        }
      }
    },
  };
}
