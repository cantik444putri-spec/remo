import { create } from "zustand";
import { persist } from "zustand/middleware";

/**
 * UI state: mostly ephemeral (open flags), but the chat panel toggles persist
 * across reloads so the layout is stable between sessions.
 */
export interface UIState {
  commandPaletteOpen: boolean;
  setCommandPaletteOpen: (open: boolean) => void;
  toggleCommandPalette: () => void;

  chatSidebarOpen: boolean;
  chatParamsOpen: boolean;
  setChatSidebarOpen: (open: boolean) => void;
  setChatParamsOpen: (open: boolean) => void;
  toggleChatSidebar: () => void;
  toggleChatParams: () => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      commandPaletteOpen: false,
      setCommandPaletteOpen: (commandPaletteOpen) => set({ commandPaletteOpen }),
      toggleCommandPalette: () =>
        set((s) => ({ commandPaletteOpen: !s.commandPaletteOpen })),

      chatSidebarOpen: true,
      chatParamsOpen: false,
      setChatSidebarOpen: (chatSidebarOpen) => set({ chatSidebarOpen }),
      setChatParamsOpen: (chatParamsOpen) => set({ chatParamsOpen }),
      toggleChatSidebar: () =>
        set((s) => ({ chatSidebarOpen: !s.chatSidebarOpen })),
      toggleChatParams: () =>
        set((s) => ({ chatParamsOpen: !s.chatParamsOpen })),
    }),
    {
      name: "rstm:ui",
      version: 1,
      // Don't persist the command palette open flag.
      partialize: (s) => ({
        chatSidebarOpen: s.chatSidebarOpen,
        chatParamsOpen: s.chatParamsOpen,
      }),
    },
  ),
);
