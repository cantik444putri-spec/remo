import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Check, Eye, EyeOff, Loader2, Trash2, Zap } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  createProvider,
  DEFAULT_PROVIDER_CONFIGS,
  type AIProviderConfig,
  type ProviderId,
} from "@/lib/providers";
import { deleteSecret, getSecret, setSecret } from "@/lib/keystore";
import { useProviderStore } from "@/stores/providers";

interface ProviderCardProps {
  id: ProviderId;
  highlight?: boolean;
}

export function ProviderCard({ id, highlight }: ProviderCardProps) {
  const config = useProviderStore((s) => s.configs[id]);
  const setConfig = useProviderStore((s) => s.setConfig);
  const resetConfig = useProviderStore((s) => s.resetConfig);
  const hasKey = useProviderStore((s) => s.hasKey[id]);
  const setHasKey = useProviderStore((s) => s.setHasKey);
  const activeProvider = useProviderStore((s) => s.activeProvider);
  const setActiveProvider = useProviderStore((s) => s.setActiveProvider);

  const [apiKey, setApiKey] = useState("");
  const [showKey, setShowKey] = useState(false);
  const [busy, setBusy] = useState<false | "save" | "test" | "remove">(false);
  const [keyPreview, setKeyPreview] = useState<string | null>(null);

  // Load a key preview (masked) so user knows whether a key exists
  useEffect(() => {
    let cancel = false;
    (async () => {
      const existing = await getSecret(config.apiKeyAlias);
      if (cancel) return;
      if (existing) {
        setKeyPreview(mask(existing));
        setHasKey(id, true);
      } else {
        setKeyPreview(null);
        setHasKey(id, false);
      }
    })();
    return () => {
      cancel = true;
    };
  }, [config.apiKeyAlias, id, setHasKey]);

  const applyPatch = (patch: Partial<AIProviderConfig>) => setConfig(id, patch);

  const onSave = async () => {
    if (!apiKey.trim()) {
      toast.error("Paste an API key first");
      return;
    }
    setBusy("save");
    try {
      await setSecret(config.apiKeyAlias, apiKey.trim());
      setKeyPreview(mask(apiKey.trim()));
      setHasKey(id, true);
      setApiKey("");
      toast.success(`Saved API key for ${config.label}`);
    } finally {
      setBusy(false);
    }
  };

  const onRemove = async () => {
    setBusy("remove");
    try {
      await deleteSecret(config.apiKeyAlias);
      setKeyPreview(null);
      setHasKey(id, false);
      toast(`Removed API key for ${config.label}`);
    } finally {
      setBusy(false);
    }
  };

  const onTest = async () => {
    const keyToTest = apiKey.trim() || (await getSecret(config.apiKeyAlias)) || "";
    if (!keyToTest) {
      toast.error("No API key to test");
      return;
    }
    setBusy("test");
    try {
      const provider = createProvider(config);
      const res = await provider.testConnection(keyToTest);
      if (res.ok) {
        toast.success(`${config.label} reachable`, {
          description: `${res.latencyMs} ms · ${res.message ?? "OK"}`,
        });
      } else {
        toast.error(`${config.label} unreachable`, {
          description: res.message ?? `after ${res.latencyMs} ms`,
        });
      }
    } finally {
      setBusy(false);
    }
  };

  const onMakeActive = () => {
    if (!config.baseUrl) {
      toast.error("Set a base URL first");
      return;
    }
    setActiveProvider(id);
    toast.success(`Active provider: ${config.label}`);
  };

  const onReset = () => {
    resetConfig(id);
    toast(`${config.label} configuration reset`);
  };

  const isActive = activeProvider === id;
  const defaults = DEFAULT_PROVIDER_CONFIGS[id];

  return (
    <Card
      className={cn(
        "relative",
        isActive && "shadow-[var(--shadow-glow)]",
      )}
    >
      <div className="absolute right-4 top-4 flex items-center gap-2">
        {highlight && (
          <span className="rounded-full bg-[var(--color-accent)]/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-[var(--color-accent)]">
            Default
          </span>
        )}
        <span
          className={cn(
            "size-2 rounded-full",
            hasKey
              ? "bg-emerald-400 shadow-[0_0_8px_theme(colors.emerald.400)]"
              : "bg-zinc-600",
          )}
          title={hasKey ? "API key saved" : "No key saved"}
        />
      </div>

      <CardHeader>
        <CardTitle>{config.label}</CardTitle>
        <CardDescription>
          {id === "openai" && "GPT-4o, GPT-4.1, and o-series reasoning models."}
          {id === "mistral" &&
            "Mistral Large, Small, Nemo, Codestral, Pixtral."}
          {id === "openrouter" &&
            "Unified access to Claude, Gemini, Llama, DeepSeek, and more."}
          {id === "custom" &&
            "Any OpenAI-compatible endpoint. Paste base URL and model id."}
        </CardDescription>
      </CardHeader>

      <CardContent className="flex flex-col gap-3 pt-2">
        <div className="flex flex-col gap-1.5">
          <label className="text-xs text-[var(--color-muted)]">Base URL</label>
          <Input
            value={config.baseUrl}
            onChange={(e) => applyPatch({ baseUrl: e.target.value })}
            placeholder={defaults.baseUrl || "https://..."}
            spellCheck={false}
            className="font-mono text-xs"
          />
        </div>

        <div className="grid grid-cols-[1fr_auto] gap-2">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-[var(--color-muted)]">
              Default model
            </label>
            <Input
              value={config.defaultModel}
              onChange={(e) => applyPatch({ defaultModel: e.target.value })}
              placeholder={defaults.defaultModel || "model-id"}
              spellCheck={false}
              className="font-mono text-xs"
            />
          </div>
          <div className="flex flex-col justify-end">
            <Button
              variant="outline"
              size="sm"
              onClick={onMakeActive}
              disabled={isActive}
              className="h-9"
            >
              <Zap className="size-3.5" />
              {isActive ? "Active" : "Use"}
            </Button>
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs text-[var(--color-muted)]">
            API key
            {keyPreview && (
              <span className="ml-2 font-mono text-[10px] text-emerald-400">
                saved · {keyPreview}
              </span>
            )}
          </label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Input
                type={showKey ? "text" : "password"}
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder={
                  keyPreview ? "replace saved key…" : "sk-... or similar"
                }
                spellCheck={false}
                className="pr-9 font-mono text-xs"
              />
              <button
                type="button"
                onClick={() => setShowKey((v) => !v)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-[var(--color-muted)] hover:text-[var(--color-foreground)]"
                aria-label={showKey ? "Hide" : "Show"}
              >
                {showKey ? (
                  <EyeOff className="size-3.5" />
                ) : (
                  <Eye className="size-3.5" />
                )}
              </button>
            </div>
            <Button
              variant="default"
              size="sm"
              onClick={onSave}
              disabled={!apiKey.trim() || busy === "save"}
              className="h-9"
            >
              {busy === "save" ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <Check className="size-3.5" />
              )}
              Save
            </Button>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 pt-1">
          <Button
            variant="secondary"
            size="sm"
            onClick={onTest}
            disabled={busy !== false || (!hasKey && !apiKey.trim())}
          >
            {busy === "test" ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <Zap className="size-3.5" />
            )}
            Test connection
          </Button>
          {hasKey && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onRemove}
              disabled={busy !== false}
              className="text-red-400 hover:text-red-300"
            >
              {busy === "remove" ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <Trash2 className="size-3.5" />
              )}
              Remove key
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={onReset}
            className="ml-auto"
          >
            Reset defaults
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function mask(s: string): string {
  if (s.length <= 8) return "••••";
  return `${s.slice(0, 3)}••••${s.slice(-4)}`;
}
