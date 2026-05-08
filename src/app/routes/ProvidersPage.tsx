import { PageShell } from "./_PageShell";
import { ProviderCard } from "@/components/provider/ProviderCard";
import { PROVIDER_ORDER } from "@/lib/providers";
import { useEffect, useState } from "react";
import { detectBackend, type KeystoreBackend } from "@/lib/keystore";
import { ShieldCheck, ShieldAlert } from "lucide-react";

export function ProvidersPage() {
  const [backend, setBackend] = useState<KeystoreBackend | null>(null);
  useEffect(() => {
    detectBackend().then(setBackend);
  }, []);
  const secure = backend === "windows-credential-manager";

  return (
    <PageShell
      title="Providers"
      description="Manage API keys for each AI provider."
      badge="M4 · secure"
    >
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {PROVIDER_ORDER.map((id) => (
          <ProviderCard key={id} id={id} highlight={id === "mistral"} />
        ))}
      </div>

      <div
        className={`mt-6 flex items-start gap-3 rounded-[var(--radius-lg)] border p-4 text-xs ${
          secure
            ? "border-emerald-500/30 bg-emerald-500/5 text-emerald-200"
            : "border-amber-500/30 bg-amber-500/5 text-amber-200"
        }`}
      >
        {secure ? (
          <ShieldCheck className="mt-0.5 size-4 shrink-0" />
        ) : (
          <ShieldAlert className="mt-0.5 size-4 shrink-0" />
        )}
        <div>
          <div className="font-semibold text-[var(--color-foreground)]">
            {secure
              ? "Windows Credential Manager"
              : backend === "localstorage-fallback"
                ? "localStorage fallback"
                : "Detecting secure storage..."}
          </div>
          <div className="text-[var(--color-muted)]">
            {secure
              ? "API keys are stored in the OS credential store under the service Remotion Studio Tools Microstock and alias rstm.provider.<id>.apiKey. They never touch the renderer's localStorage."
              : backend === "localstorage-fallback"
                ? "You're running outside Tauri. Keys are kept in the browser localStorage for development only. Run npm run tauri:dev for the secure backend."
                : "Checking whether the Tauri keystore bridge is available."}
          </div>
        </div>
      </div>
    </PageShell>
  );
}
