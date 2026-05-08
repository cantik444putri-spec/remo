import { create } from "zustand";
import { persist } from "zustand/middleware";
import { mainDefaults, type MainCompositionProps } from "@/remotion/Main";
import { DEFAULT_PRESET_ID, getPreset } from "@/remotion/presets";
import type { Storyboard } from "@/lib/storyboard";

export interface StudioState {
  /** Live-editable props for the Main composition. Drives the Player. */
  composition: MainCompositionProps;
  /** Preset id selected for the next render. */
  presetId: string;
  /** Seconds the user scrubbed to last (re-used as initial player position). */
  lastScrubFrame: number;
  /** Safe-area overlay toggle (TV/social). */
  safeArea: "off" | "tv" | "instagram" | "tiktok";

  /** AI-generated storyboard awaiting user approval (null = no pending draft). */
  pendingStoryboard: Storyboard | null;
  /** Open state of the AI storyboard side panel. */
  storyboardPanelOpen: boolean;
  /** Last prompt the user ran through the AI, kept for re-runs. */
  lastStoryboardPrompt: string;

  setComposition: (partial: Partial<MainCompositionProps>) => void;
  setTitle: (partial: Partial<MainCompositionProps["title"]>) => void;
  setLowerThird: (partial: Partial<MainCompositionProps["lowerThird"]>) => void;
  setOutro: (partial: Partial<MainCompositionProps["outro"]>) => void;
  setHud: (partial: Partial<MainCompositionProps["hud"]>) => void;
  setParticles: (partial: Partial<MainCompositionProps["particles"]>) => void;
  applyComposition: (next: MainCompositionProps) => void;
  setPreset: (id: string) => void;
  setLastScrubFrame: (frame: number) => void;
  setSafeArea: (v: StudioState["safeArea"]) => void;

  setPendingStoryboard: (s: Storyboard | null) => void;
  setStoryboardPanelOpen: (v: boolean) => void;
  toggleStoryboardPanel: () => void;
  setLastStoryboardPrompt: (v: string) => void;

  reset: () => void;
}

export const useStudioStore = create<StudioState>()(
  persist(
    (set) => ({
      composition: mainDefaults,
      presetId: DEFAULT_PRESET_ID,
      lastScrubFrame: 0,
      safeArea: "off",

      pendingStoryboard: null,
      storyboardPanelOpen: false,
      lastStoryboardPrompt: "",

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
      applyComposition: (next) => set({ composition: next }),

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

      setPendingStoryboard: (pendingStoryboard) => set({ pendingStoryboard }),
      setStoryboardPanelOpen: (storyboardPanelOpen) => set({ storyboardPanelOpen }),
      toggleStoryboardPanel: () =>
        set((s) => ({ storyboardPanelOpen: !s.storyboardPanelOpen })),
      setLastStoryboardPrompt: (lastStoryboardPrompt) =>
        set({ lastStoryboardPrompt }),

      reset: () =>
        set({
          composition: mainDefaults,
          presetId: DEFAULT_PRESET_ID,
          lastScrubFrame: 0,
          safeArea: "off",
          pendingStoryboard: null,
          storyboardPanelOpen: false,
        }),
    }),
    {
      name: "rstm:studio",
      version: 3,
      // Persist the prompt so the user can iterate without retyping, but
      // drop any pending draft on reload (it's a one-shot approval flow).
      partialize: (s) => ({
        composition: s.composition,
        presetId: s.presetId,
        safeArea: s.safeArea,
        lastStoryboardPrompt: s.lastStoryboardPrompt,
      }),
      migrate: (state) => {
        const s = state as Partial<StudioState>;
        return {
          ...s,
          composition: { ...mainDefaults, ...(s.composition ?? {}) },
          pendingStoryboard: null,
          storyboardPanelOpen: false,
          lastStoryboardPrompt: s.lastStoryboardPrompt ?? "",
        } as StudioState;
      },
    },
  ),
);
