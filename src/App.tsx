import { Route, Routes, Navigate, useLocation } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import { TitleBar } from "./app/layout/TitleBar";
import { Sidebar } from "./app/layout/Sidebar";
import { CommandPalette } from "./app/layout/CommandPalette";
import { Onboarding } from "./app/layout/Onboarding";
import { Toaster } from "./components/ui/toaster";
import { ChatPage } from "./app/routes/ChatPage";
import { StudioPage } from "./app/routes/StudioPage";
import { MicrostockPage } from "./app/routes/MicrostockPage";
import { ProvidersPage } from "./app/routes/ProvidersPage";
import { RendersPage } from "./app/routes/RendersPage";
import { SettingsPage } from "./app/routes/SettingsPage";
import { useEffect } from "react";
import { toast } from "sonner";
import { useTheme } from "./hooks/useTheme";
import {
  defaultShortcutCombos,
  useKeyboardShortcuts,
} from "./hooks/useKeyboardShortcuts";
import { useUIStore } from "./stores/ui";
import { useSettingsStore } from "./stores/settings";
import { useProviderStore } from "./stores/providers";
import { useChatStore } from "./stores/chat";
import { hasSecret } from "./lib/keystore";
import { PROVIDER_ORDER } from "./lib/providers";
import { useStudioStore } from "./stores/studio";
import {
  ensureRenderSubscriptions,
  refreshRenderList,
  startRender,
} from "./lib/renderService";

export function App() {
  const location = useLocation();
  const toggleCommandPalette = useUIStore((s) => s.toggleCommandPalette);
  const toggleSidebar = useSettingsStore((s) => s.toggleSidebar);

  // Apply theme/accent to <html>
  useTheme();

  // On boot, reconcile which providers have a saved API key so the UI can
  // show the green dot immediately without waiting for the Providers page.
  const setHasKey = useProviderStore((s) => s.setHasKey);
  const configs = useProviderStore((s) => s.configs);
  useEffect(() => {
    let cancelled = false;
    (async () => {
      for (const id of PROVIDER_ORDER) {
        const alias = configs[id].apiKeyAlias;
        const present = await hasSecret(alias);
        if (cancelled) return;
        setHasKey(id, present);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [configs, setHasKey]);

  // Wire Rust render events once on boot and rehydrate the queue from
  // whatever the backend already knows (survives UI reloads).
  useEffect(() => {
    void ensureRenderSubscriptions();
    void refreshRenderList();
  }, []);

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
    {
      id: "newChat",
      keys: "Ctrl+N",
      combo: defaultShortcutCombos.newChat,
      handler: () => {
        window.history.pushState({}, "", "/chat");
        window.dispatchEvent(new PopStateEvent("popstate"));
        useChatStore.getState().newConversation();
        toast("New conversation");
      },
    },
    {
      id: "renderProject",
      keys: "Ctrl+R",
      combo: defaultShortcutCombos.renderProject,
      handler: () => {
        const licenseOk =
          useSettingsStore.getState().remotionEligibleFree ||
          !!useSettingsStore.getState().remotionCompanyLicenseKey;
        if (!licenseOk) {
          toast.error("Remotion license not set", {
            description: "Open Settings to enable Free eligibility or paste a key.",
          });
          return;
        }
        const composition = useStudioStore.getState().composition;
        const projectName = composition.title.title?.trim() || "Remotion Studio";
        startRender({ projectName })
          .then(() => {
            window.history.pushState({}, "", "/renders");
            window.dispatchEvent(new PopStateEvent("popstate"));
          })
          .catch((err: unknown) => {
            const msg = err instanceof Error ? err.message : "Render failed to start";
            toast.error("Render could not start", { description: msg });
          });
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
      <Onboarding />
      <Toaster />
    </div>
  );
}
