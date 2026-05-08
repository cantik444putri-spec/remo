import { useEffect } from "react";

/**
 * Typed shortcut definition.
 * `mod` represents Ctrl on Windows/Linux, Cmd on macOS.
 */
export interface Shortcut {
  id: string;
  keys: string; // display label, e.g. "Ctrl+K"
  combo: (e: KeyboardEvent) => boolean;
  handler: (e: KeyboardEvent) => void;
}

const isMod = (e: KeyboardEvent) => e.ctrlKey || e.metaKey;

export const defaultShortcutCombos = {
  commandPalette: (e: KeyboardEvent) =>
    isMod(e) && (e.key === "k" || e.key === "K"),
  newChat: (e: KeyboardEvent) =>
    isMod(e) && !e.shiftKey && (e.key === "n" || e.key === "N"),
  openSettings: (e: KeyboardEvent) => isMod(e) && e.key === ",",
  toggleSidebar: (e: KeyboardEvent) =>
    isMod(e) && (e.key === "b" || e.key === "B"),
  renderProject: (e: KeyboardEvent) =>
    isMod(e) && !e.shiftKey && (e.key === "r" || e.key === "R"),
} as const;

/**
 * Register a list of shortcuts. They fire on keydown at window level and
 * skip when focus is inside an editable element unless explicitly allowed.
 */
export function useKeyboardShortcuts(shortcuts: Shortcut[]) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const isEditable =
        !!target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable);

      for (const s of shortcuts) {
        if (!s.combo(e)) continue;

        // Always allow command palette to open from inputs
        const allowInEditable = s.id === "commandPalette";
        if (isEditable && !allowInEditable) continue;

        e.preventDefault();
        s.handler(e);
        return;
      }
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [shortcuts]);
}
