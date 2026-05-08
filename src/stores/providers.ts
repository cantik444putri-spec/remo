import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  DEFAULT_PROVIDER_CONFIGS,
  type AIProviderConfig,
  type ProviderId,
} from "@/lib/providers";

export interface ProviderRuntimeState {
  /** Per-provider config (base URL, default model, headers). */
  configs: Record<ProviderId, AIProviderConfig>;
  /** Which provider is currently active for chat. */
  activeProvider: ProviderId;
  /** Model id currently selected (overrides config.defaultModel). */
  activeModel: string;
  /** Track which provider has a saved key so UI can show a green dot. */
  hasKey: Record<ProviderId, boolean>;

  setConfig: (id: ProviderId, patch: Partial<AIProviderConfig>) => void;
  resetConfig: (id: ProviderId) => void;
  setActiveProvider: (id: ProviderId) => void;
  setActiveModel: (model: string) => void;
  setHasKey: (id: ProviderId, hasKey: boolean) => void;
}

export const useProviderStore = create<ProviderRuntimeState>()(
  persist(
    (set) => ({
      configs: { ...DEFAULT_PROVIDER_CONFIGS },
      activeProvider: "mistral",
      activeModel: DEFAULT_PROVIDER_CONFIGS.mistral.defaultModel,
      hasKey: {
        openai: false,
        mistral: false,
        openrouter: false,
        custom: false,
      },

      setConfig: (id, patch) =>
        set((s) => ({
          configs: {
            ...s.configs,
            [id]: { ...s.configs[id], ...patch },
          },
        })),
      resetConfig: (id) =>
        set((s) => ({
          configs: { ...s.configs, [id]: { ...DEFAULT_PROVIDER_CONFIGS[id] } },
        })),
      setActiveProvider: (id) =>
        set((s) => ({
          activeProvider: id,
          activeModel: s.configs[id].defaultModel || s.activeModel,
        })),
      setActiveModel: (model) => set({ activeModel: model }),
      setHasKey: (id, hasKey) =>
        set((s) => ({ hasKey: { ...s.hasKey, [id]: hasKey } })),
    }),
    {
      name: "rstm:providers",
      version: 1,
      // Only persist configs + selection. Ephemeral state is recomputed.
      partialize: (s) => ({
        configs: s.configs,
        activeProvider: s.activeProvider,
        activeModel: s.activeModel,
        hasKey: s.hasKey,
      }),
    },
  ),
);
