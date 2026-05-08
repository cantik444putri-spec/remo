import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { PageShell } from "./_PageShell";

const providers = [
  {
    id: "openai",
    label: "OpenAI",
    baseUrl: "https://api.openai.com/v1",
    defaultModel: "gpt-4o-mini",
  },
  {
    id: "mistral",
    label: "Mistral",
    baseUrl: "https://api.mistral.ai/v1",
    defaultModel: "mistral-large-latest",
    highlight: true,
  },
  {
    id: "openrouter",
    label: "OpenRouter",
    baseUrl: "https://openrouter.ai/api/v1",
    defaultModel: "openrouter/auto",
  },
  {
    id: "custom",
    label: "Custom",
    baseUrl: "(set your own base URL)",
    defaultModel: "(any OpenAI-compatible model id)",
  },
] as const;

export function ProvidersPage() {
  return (
    <PageShell
      title="Providers"
      description="Kelola API key untuk tiap provider AI. Disimpan aman di Windows Credential Manager."
      badge="M4 · coming soon"
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {providers.map((p) => (
          <Card key={p.id} className="relative">
            {p.highlight && (
              <span className="absolute right-4 top-4 rounded-full bg-[var(--color-accent)]/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-[var(--color-accent)]">
                Default
              </span>
            )}
            <CardHeader>
              <CardTitle>{p.label}</CardTitle>
              <CardDescription className="font-mono text-xs">
                {p.baseUrl}
              </CardDescription>
            </CardHeader>
            <div className="flex items-center justify-between text-xs">
              <span className="text-[var(--color-muted)]">Default model</span>
              <code className="rounded bg-[var(--color-bg)]/60 px-2 py-1 font-mono text-[11px]">
                {p.defaultModel}
              </code>
            </div>
          </Card>
        ))}
      </div>
    </PageShell>
  );
}
