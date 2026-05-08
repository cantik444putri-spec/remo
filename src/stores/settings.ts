import { create } from "zustand";
import { persist } from "zustand/middleware";

/**
 * Theme variants supported by the shell.
 * - `dark`   : default zinc-based dark theme
 * - `oled`   : pure-black background for OLED displays
 */
export type ThemeMode = "dark" | "oled";

/**
 * Accent gradient presets. Applied as CSS variables
 * --color-accent and --color-accent-2 on :root.
 */
export const ACCENT_PRESETS = {
  violet: { from: "270 95% 70%", to: "320 95% 65%", label: "Violet → Fuchsia" },
  cyan: { from: "190 95% 55%", to: "260 90% 65%", label: "Cyan → Indigo" },
  lime: { from: "130 80% 55%", to: "190 90% 55%", label: "Lime → Cyan" },
  amber: { from: "35 95% 60%", to: "0 90% 60%", label: "Amber → Rose" },
} as const;

export type AccentKey = keyof typeof ACCENT_PRESETS;

export interface SettingsState {
  theme: ThemeMode;
  accent: AccentKey;
  sidebarCollapsed: boolean;
  remotionEligibleFree: boolean;
  remotionCompanyLicenseKey: string | null;
  /** True once the user has completed the onboarding wizard. */
  onboarded: boolean;

  setTheme: (mode: ThemeMode) => void;
  toggleTheme: () => void;
  setAccent: (accent: AccentKey) => void;
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  setRemotionEligibleFree: (v: boolean) => void;
  setRemotionCompanyLicenseKey: (v: string | null) => void;
  setOnboarded: (v: boolean) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      theme: "dark",
      accent: "violet",
      sidebarCollapsed: false,
      remotionEligibleFree: true,
      remotionCompanyLicenseKey: null,
      onboarded: false,

      setTheme: (mode) => set({ theme: mode }),
      toggleTheme: () =>
        set((s) => ({ theme: s.theme === "dark" ? "oled" : "dark" })),
      setAccent: (accent) => set({ accent }),
      toggleSidebar: () =>
        set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
      setSidebarCollapsed: (sidebarCollapsed) => set({ sidebarCollapsed }),
      setRemotionEligibleFree: (remotionEligibleFree) =>
        set({ remotionEligibleFree }),
      setRemotionCompanyLicenseKey: (remotionCompanyLicenseKey) =>
        set({ remotionCompanyLicenseKey }),
      setOnboarded: (onboarded) => set({ onboarded }),
    }),
    {
      name: "rstm:settings",
      version: 1,
    },
  ),
);
