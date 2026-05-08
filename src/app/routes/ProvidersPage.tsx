import { PageShell } from "./_PageShell";
import { ProviderCard } from "@/components/provider/ProviderCard";
import { PROVIDER_ORDER } from "@/lib/providers";

export function ProvidersPage() {
  return (
    <PageShell
      title="Providers"
      description="Manage API keys for each AI provider. Keys are stored securely (Windows Credential Manager in M4)."
      badge="M3 · live"
    >
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {PROVIDER_ORDER.map((id) => (
          <ProviderCard
            key={id}
            id={id}
            highlight={id === "mistral"}
          />
        ))}
      </div>

      <div className="mt-6 rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)]/40 p-4 text-xs text-[var(--color-muted)]">
        <div className="mb-1 font-semibold text-[var(--color-foreground)]">
          Security note
        </div>
        During development, keys are kept in the browser&apos;s local storage.
        When M4 ships, they move to the Windows Credential Manager via a Tauri
        command and never touch the renderer again.
      </div>
    </PageShell>
  );
}
