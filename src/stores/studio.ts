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
  setHud: (partial: Partial<MainCompositionProps["hud"]>) => void;
  setParticles: (partial: Partial<MainCompositionProps["particles"]>) => void;
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
      setHud: (partial) =>
        set((s) => ({
          composition: {
            ...s.composition,
            hud: { ...s.composition.hud, ...partial },
          },
        })),
      setParticles: (partial) =>
        set((s) => ({
          composition: {
            ...s.composition,
            particles: { ...s.composition.particles, ...partial },
          },
        })),
      setPreset: (id) => {
        const preset = getPreset(id);
        set((s) => ({
          presetId: preset.id,
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
      version: 2,
      partialize: (s) => ({
        composition: s.composition,
        presetId: s.presetId,
        safeArea: s.safeArea,
      }),
      // v1 -> v2: merge any missing fields (HUD, particles, transition)
      // with the current defaults so older persisted state still renders.
      migrate: (state) => {
        const s = state as Partial<StudioState>;
        return {
          ...s,
          composition: { ...mainDefaults, ...(s.composition ?? {}) },
        } as StudioState;
      },
    },
  ),
);
