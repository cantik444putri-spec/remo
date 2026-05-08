/**
 * Provider registry. Each slot holds a live provider instance created from
 * the user-editable config in the settings store. The registry is recreated
 * whenever a config is changed so concrete providers always reflect the
 * current base URL / headers.
 */

import {
  DEFAULT_PROVIDER_CONFIGS,
  type AIProvider,
  type AIProviderConfig,
  type ProviderId,
} from "./base";
import { createOpenAICompatibleProvider } from "./openai-compatible";

export { DEFAULT_PROVIDER_CONFIGS } from "./base";
export type {
  AIProvider,
  AIProviderConfig,
  ChatChunk,
  ChatMessage,
  ChatParams,
  ModelInfo,
  ProviderId,
  TestResult,
} from "./base";

export function createProvider(config: AIProviderConfig): AIProvider {
  // Today every built-in provider uses the OpenAI-compatible transport.
  // Future providers with a different wire format would dispatch here.
  return createOpenAICompatibleProvider(config);
}

export function defaultConfig(id: ProviderId): AIProviderConfig {
  return { ...DEFAULT_PROVIDER_CONFIGS[id] };
}

export const PROVIDER_ORDER: ProviderId[] = [
  "mistral",
  "openai",
  "openrouter",
  "custom",
];

/** Curated quick-pick models per provider. Users can type any model id. */
export const CURATED_MODELS: Record<ProviderId, string[]> = {
  openai: [
    "gpt-4o-mini",
    "gpt-4o",
    "gpt-4.1-mini",
    "gpt-4.1",
    "o4-mini",
  ],
  mistral: [
    "mistral-large-latest",
    "mistral-small-latest",
    "open-mistral-nemo",
    "codestral-latest",
    "pixtral-large-latest",
  ],
  openrouter: [
    "openrouter/auto",
    "anthropic/claude-3.5-sonnet",
    "anthropic/claude-3.5-haiku",
    "google/gemini-2.0-flash-exp",
    "meta-llama/llama-3.3-70b-instruct",
    "deepseek/deepseek-chat",
  ],
  custom: [],
};
