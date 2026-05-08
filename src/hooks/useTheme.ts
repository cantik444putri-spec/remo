import { useEffect } from "react";
import { ACCENT_PRESETS, useSettingsStore } from "@/stores/settings";

/**
 * Applies theme + accent CSS variables to <html>.
 * Mount once at the app root.
 */
export function useTheme() {
  const theme = useSettingsStore((s) => s.theme);
  const accent = useSettingsStore((s) => s.accent);

  useEffect(() => {
    const root = document.documentElement;

    // Theme: toggle classes so @custom-variant dark picks it up
    root.classList.toggle("dark", theme === "dark" || theme === "oled");
    root.classList.toggle("oled", theme === "oled");
    root.dataset.theme = theme;

    // OLED: override background variables at :root
    if (theme === "oled") {
      root.style.setProperty("--color-bg", "hsl(0 0% 0%)");
      root.style.setProperty("--color-surface", "hsl(0 0% 6%)");
      root.style.setProperty("--color-surface-hover", "hsl(0 0% 10%)");
    } else {
      root.style.removeProperty("--color-bg");
      root.style.removeProperty("--color-surface");
      root.style.removeProperty("--color-surface-hover");
    }
  }, [theme]);

  useEffect(() => {
    const root = document.documentElement;
    const preset = ACCENT_PRESETS[accent];
    root.style.setProperty("--color-accent", `hsl(${preset.from})`);
    root.style.setProperty("--color-accent-2", `hsl(${preset.to})`);
  }, [accent]);
}
