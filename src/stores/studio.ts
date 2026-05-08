import { create } from "zustand";
import { persist } from "zustand/middleware";
import { mainDefaults, type MainCompositionProps } from "@/remotion/Main";
import { DEFAULT_PRESET_ID, getPreset } from "@/remotion/presets";

export interface StudioState {
  /** Live-editable props for the Main composition. Drives the Player. */
  composition: MainCompositionProps;
  /** Preset id selected for the next render. */
  presetId: string;
  /** Seconds the user scrubbed to last (re-used as initial player position). */
  lastScrubFrame: number;
  /** Safe-area overlay toggle (TV/social). */
  safeArea: "off" | "tv" | "instagram" | "tiktok";

  setComposition: (partial: Partial<MainCompositionProps>) => void;
  setTitle: (partial: Partial<MainCompositionProps["title"]>) => void;
  setLowerThird: (partial: Partial<MainCompositionProps["lowerThird"]>) => void;
  setOutro: (partial: Partial<MainCompositionProps["outro"]>) => void;
  setPreset: (id: string) => void;
  setLastScrubFrame: (frame: number) => void;
  setSafeArea: (v: StudioState["safeArea"]) => void;
  reset: () => void;
}

export const useStudioStore = create<StudioState>()(
  persist(
    (set) => ({
      composition: mainDefaults,
      presetId: DEFAULT_PRESET_ID,
      lastScrubFrame: 0,
      safeArea: "off",

      setComposition: (partial) =>
        set((s) => ({ composition: { ...s.composition, ...partial } })),
      setTitle: (partial) =>
        set((s) => ({
          composition: {
            ...s.composition,
            title: { ...s.composition.title, ...partial },
          },
        })),
      setLowerThird: (partial) =>
        set((s) => ({
          composition: {
            ...s.composition,
            lowerThird: { ...s.composition.lowerThird, ...partial },
          },
        })),
      setOutro: (partial) =>
        set((s) => ({
          composition: {
            ...s.composition,
            outro: { ...s.composition.outro, ...partial },
          },
        })),
      setPreset: (id) => {
        const preset = getPreset(id);
        set((s) => ({
          presetId: preset.id,
          // Toggling to an alpha-capable preset turns the background off;
          // the user can override in the Inspector.
          composition: preset.supportsAlpha
            ? { ...s.composition, transparentBackground: true }
            : { ...s.composition, transparentBackground: false },
        }));
      },
      setLastScrubFrame: (lastScrubFrame) => set({ lastScrubFrame }),
      setSafeArea: (safeArea) => set({ safeArea }),
      reset: () =>
        set({
          composition: mainDefaults,
          presetId: DEFAULT_PRESET_ID,
          lastScrubFrame: 0,
          safeArea: "off",
        }),
    }),
    {
      name: "rstm:studio",
      version: 1,
      // Don't persist the scrub frame (it's transient UI).
      partialize: (s) => ({
        composition: s.composition,
        presetId: s.presetId,
        safeArea: s.safeArea,
      }),
    },
  ),
);
