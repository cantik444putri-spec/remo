import { Route, Routes, Navigate, useLocation } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import { TitleBar } from "./app/layout/TitleBar";
import { Sidebar } from "./app/layout/Sidebar";
import { CommandPalette } from "./app/layout/CommandPalette";
import { Toaster } from "./components/ui/toaster";
import { ChatPage } from "./app/routes/ChatPage";
import { StudioPage } from "./app/routes/StudioPage";
import { MicrostockPage } from "./app/routes/MicrostockPage";
import { ProvidersPage } from "./app/routes/ProvidersPage";
import { RendersPage } from "./app/routes/RendersPage";
import { SettingsPage } from "./app/routes/SettingsPage";
import { useTheme } from "./hooks/useTheme";
import {
  defaultShortcutCombos,
  useKeyboardShortcuts,
} from "./hooks/useKeyboardShortcuts";
import { useUIStore } from "./stores/ui";
import { useSettingsStore } from "./stores/settings";

export function App() {
  const location = useLocation();
  const toggleCommandPalette = useUIStore((s) => s.toggleCommandPalette);
  const toggleSidebar = useSettingsStore((s) => s.toggleSidebar);

  // Apply theme/accent to <html>
  useTheme();

  // Global shortcuts
  useKeyboardShortcuts([
    {
      id: "commandPalette",
      keys: "Ctrl+K",
      combo: defaultShortcutCombos.commandPalette,
      handler: () => toggleCommandPalette(),
    },
    {
      id: "toggleSidebar",
      keys: "Ctrl+B",
      combo: defaultShortcutCombos.toggleSidebar,
      handler: () => toggleSidebar(),
    },
    {
      id: "openSettings",
      keys: "Ctrl+,",
      combo: defaultShortcutCombos.openSettings,
      handler: () => {
        window.history.pushState({}, "", "/settings");
        window.dispatchEvent(new PopStateEvent("popstate"));
      },
    },
  ]);

  return (
    <div className="flex h-screen flex-col">
      <TitleBar />
      <div className="flex min-h-0 flex-1">
        <Sidebar />
        <main className="relative min-w-0 flex-1 overflow-auto">
          <AnimatePresence mode="wait">
            <Routes location={location} key={location.pathname}>
              <Route path="/" element={<Navigate to="/chat" replace />} />
              <Route path="/chat" element={<ChatPage />} />
              <Route path="/studio" element={<StudioPage />} />
              <Route path="/microstock" element={<MicrostockPage />} />
              <Route path="/providers" element={<ProvidersPage />} />
              <Route path="/renders" element={<RendersPage />} />
              <Route path="/settings" element={<SettingsPage />} />
              <Route
                path="*"
                element={
                  <div className="p-8 text-[var(--color-muted)]">
                    Page not found
                  </div>
                }
              />
            </Routes>
          </AnimatePresence>
        </main>
      </div>
      <CommandPalette />
      <Toaster />
    </div>
  );
}
