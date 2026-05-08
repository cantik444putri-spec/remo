import { Route, Routes, Navigate } from "react-router-dom";
import { TitleBar } from "./app/layout/TitleBar";
import { Sidebar } from "./app/layout/Sidebar";
import { ChatPage } from "./app/routes/ChatPage";
import { StudioPage } from "./app/routes/StudioPage";
import { MicrostockPage } from "./app/routes/MicrostockPage";
import { ProvidersPage } from "./app/routes/ProvidersPage";
import { RendersPage } from "./app/routes/RendersPage";
import { SettingsPage } from "./app/routes/SettingsPage";

export function App() {
  return (
    <div className="flex h-screen flex-col">
      <TitleBar />
      <div className="flex min-h-0 flex-1">
        <Sidebar />
        <main className="relative min-w-0 flex-1 overflow-auto">
          <Routes>
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
        </main>
      </div>
    </div>
  );
}
