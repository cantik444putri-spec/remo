import { useEffect, useMemo, useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { AnimatePresence, motion } from "framer-motion";
import { toast } from "sonner";
import {
  ArrowRight,
  Check,
  ExternalLink,
  Eye,
  EyeOff,
  Loader2,
  Lock,
  Palette,
  ShieldCheck,
  Sparkles,
  Video,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import {
  ACCENT_PRESETS,
  type AccentKey,
  useSettingsStore,
} from "@/stores/settings";
import { useProviderStore } from "@/stores/providers";
import { DEFAULT_PROVIDER_CONFIGS, type ProviderId, createProvider } from "@/lib/providers";
import {
  detectBackend,
  setSecret,
  type KeystoreBackend,
} from "@/lib/keystore";

type Step = "welcome" | "accent" | "provider" | "remotion" | "done";

const STEPS: Step[] = ["welcome", "accent", "provider", "remotion", "done"];

/**
 * First-run onboarding: 4 steps to get the user productive.
 * Shown automatically when `onboarded=false` in the settings store.
 */
export function Onboarding() {
  const onboarded = useSettingsStore((s) => s.onboarded);
  const setOnboarded = useSettingsStore((s) => s.setOnboarded);

  const [step, setStep] = useState<Step>("welcome");
  const [open, setOpen] = useState(!onboarded);

  useEffect(() => {
    setOpen(!onboarded);
  }, [onboarded]);

  if (!open) return null;
  const idx = STEPS.indexOf(step);

  const finish = () => {
    setOnboarded(true);
    setOpen(false);
    toast.success("All set!", {
      description: "You can revisit these choices in Settings.",
    });
  };

  return (
    <Dialog.Root
      open={open}
      onOpenChange={(v) => {
        // Only allow closing via the final step's CTA.
        if (!v && step !== "done") return;
        setOpen(v);
      }}
    >
      <Dialog.Portal>
        <Dialog.Overlay asChild>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="fixed inset-0 z-[120] bg-black/60 backdrop-blur-md"
          />
        </Dialog.Overlay>
        <Dialog.Content asChild>
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
            className="fixed left-1/2 top-1/2 z-[121] w-[92vw] max-w-xl -translate-x-1/2 -translate-y-1/2"
          >
            <div className="glass overflow-hidden rounded-[var(--radius-xl)] shadow-2xl shadow-black/50">
              <Dialog.Title className="sr-only">
                Welcome to Remotion Studio Tools Microstock
              </Dialog.Title>
              <Dialog.Description className="sr-only">
                First-run onboarding.
              </Dialog.Description>

              {/* Progress strip */}
              <div className="h-1 w-full bg-[var(--color-surface)]">
                <motion.div
                  initial={false}
                  animate={{ width: `${((idx + 1) / STEPS.length) * 100}%` }}
                  transition={{ duration: 0.3, ease: "easeOut" }}
                  className="h-full gradient-accent"
                />
              </div>

              <div className="p-8">
                <AnimatePresence mode="wait">
                  {step === "welcome" && (
                    <WelcomeStep
                      key="welcome"
                      onNext={() => setStep("accent")}
                    />
                  )}
                  {step === "accent" && (
                    <AccentStep
                      key="accent"
                      onNext={() => setStep("provider")}
                    />
                  )}
                  {step === "provider" && (
                    <ProviderStep
                      key="provider"
                      onNext={() => setStep("remotion")}
                    />
                  )}
                  {step === "remotion" && (
                    <RemotionStep
                      key="remotion"
                      onNext={() => setStep("done")}
                    />
                  )}
                  {step === "done" && <DoneStep key="done" onFinish={finish} />}
                </AnimatePresence>
              </div>
            </div>
          </motion.div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

/* -------------------------------------------------------------------------- */
/* Step components                                                             */
/* -------------------------------------------------------------------------- */

function WelcomeStep({ onNext }: { onNext: () => void }) {
  const [backend, setBackend] = useState<KeystoreBackend | null>(null);
  useEffect(() => {
    detectBackend().then(setBackend);
  }, []);

  return (
    <StepFrame
      icon={<Sparkles className="size-6 text-white" />}
      eyebrow="Welcome"
      title="Remotion Studio Tools Microstock"
      subtitle="AI assistant + live-preview Remotion studio, tuned for microstock creators. Default output: 4K UHD · 30 fps."
    >
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <FeatureTile
          icon={<Sparkles className="size-4" />}
          label="Multi-provider AI"
          detail="OpenAI · Mistral · OpenRouter · Custom"
        />
        <FeatureTile
          icon={<Video className="size-4" />}
          label="Remotion studio"
          detail="Live preview + 4K30 default"
        />
        <FeatureTile
          icon={<ShieldCheck className="size-4" />}
          label="Secure secrets"
          detail={
            backend === "windows-credential-manager"
              ? "Windows Credential Manager"
              : backend === "localstorage-fallback"
                ? "localStorage (dev fallback)"
                : "Detecting…"
          }
        />
      </div>
      <StepFooter onNext={onNext} nextLabel="Get started" />
    </StepFrame>
  );
}

function AccentStep({ onNext }: { onNext: () => void }) {
  const accent = useSettingsStore((s) => s.accent);
  const setAccent = useSettingsStore((s) => s.setAccent);
  const theme = useSettingsStore((s) => s.theme);
  const toggleTheme = useSettingsStore((s) => s.toggleTheme);

  return (
    <StepFrame
      icon={<Palette className="size-6 text-white" />}
      eyebrow="Step 1 of 3"
      title="Pick an accent"
      subtitle="You can change any of this anytime from Settings or the command palette."
    >
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {(Object.entries(ACCENT_PRESETS) as [
          AccentKey,
          (typeof ACCENT_PRESETS)[AccentKey],
        ][]).map(([key, preset]) => (
          <button
            key={key}
            type="button"
            onClick={() => setAccent(key)}
            className={cn(
              "group flex items-center gap-2 rounded-[var(--radius-md)] border p-3 text-left text-xs transition-all",
              accent === key
                ? "border-[var(--color-accent)] bg-[var(--color-surface)] shadow-[var(--shadow-glow)]"
                : "border-[var(--color-border)] bg-[var(--color-surface)]/40 hover:bg-[var(--color-surface)]",
            )}
          >
            <span
              className="size-5 shrink-0 rounded-full"
              style={{
                background: `linear-gradient(135deg, hsl(${preset.from}), hsl(${preset.to}))`,
              }}
            />
            <div className="min-w-0">
              <div className="truncate text-[var(--color-foreground)]">
                {preset.label}
              </div>
              {accent === key && (
                <div className="text-[10px] text-[var(--color-accent)]">
                  selected
                </div>
              )}
            </div>
          </button>
        ))}
      </div>

      <div className="mt-4 flex items-center justify-between rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)]/40 px-3 py-2">
        <div>
          <div className="text-sm font-medium">OLED true-black</div>
          <div className="text-xs text-[var(--color-muted)]">
            Pure black background for OLED displays.
          </div>
        </div>
        <Switch checked={theme === "oled"} onCheckedChange={toggleTheme} />
      </div>

      <StepFooter onNext={onNext} />
    </StepFrame>
  );
}

function ProviderStep({ onNext }: { onNext: () => void }) {
  const configs = useProviderStore((s) => s.configs);
  const setActiveProvider = useProviderStore((s) => s.setActiveProvider);
  const setHasKey = useProviderStore((s) => s.setHasKey);

  const providers: { id: ProviderId; blurb: string }[] = useMemo(
    () => [
      { id: "mistral", blurb: "mistral-large-latest (default)" },
      { id: "openai", blurb: "gpt-4o-mini · gpt-4o · o4-mini" },
      { id: "openrouter", blurb: "Claude · Gemini · Llama (one key)" },
      { id: "custom", blurb: "Any OpenAI-compatible endpoint" },
    ],
    [],
  );

  const [selected, setSelected] = useState<ProviderId>("mistral");
  const [apiKey, setApiKey] = useState("");
  const [showKey, setShowKey] = useState(false);
  const [busy, setBusy] = useState<null | "test" | "save">(null);

  const config = configs[selected];

  const onTest = async () => {
    if (!apiKey.trim()) return;
    if (!config.baseUrl) {
      toast.error("Set a base URL first (switch provider or edit in Providers)");
      return;
    }
    setBusy("test");
    try {
      const p = createProvider(config);
      const res = await p.testConnection(apiKey.trim());
      if (res.ok) {
        toast.success(`${config.label} reachable`, {
          description: `${res.latencyMs} ms`,
        });
      } else {
        toast.error(`${config.label} unreachable`, {
          description: res.message ?? `after ${res.latencyMs} ms`,
        });
      }
    } finally {
      setBusy(null);
    }
  };

  const onSaveAndContinue = async () => {
    if (!apiKey.trim()) {
      // Allow skipping: user can add a key later in Providers.
      onNext();
      return;
    }
    setBusy("save");
    try {
      await setSecret(config.apiKeyAlias, apiKey.trim());
      setHasKey(selected, true);
      setActiveProvider(selected);
      toast.success(`${config.label} key saved`);
      onNext();
    } finally {
      setBusy(null);
    }
  };

  return (
    <StepFrame
      icon={<Lock className="size-6 text-white" />}
      eyebrow="Step 2 of 3"
      title="Connect an AI provider"
      subtitle="Paste an API key to get started. It is stored in the Windows Credential Manager (or a local fallback for web dev)."
    >
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {providers.map(({ id, blurb }) => (
          <button
            key={id}
            type="button"
            onClick={() => setSelected(id)}
            className={cn(
              "rounded-[var(--radius-md)] border p-2 text-left text-xs transition-all",
              selected === id
                ? "border-[var(--color-accent)] bg-[var(--color-surface)]"
                : "border-[var(--color-border)] bg-[var(--color-surface)]/40 hover:bg-[var(--color-surface)]",
            )}
          >
            <div className="text-sm font-medium">
              {DEFAULT_PROVIDER_CONFIGS[id].label}
            </div>
            <div className="mt-1 text-[10px] text-[var(--color-muted)]">
              {blurb}
            </div>
          </button>
        ))}
      </div>

      {selected === "custom" && !config.baseUrl && (
        <div className="rounded-[var(--radius-md)] border border-amber-500/30 bg-amber-500/10 p-2 text-xs text-amber-200">
          Custom provider needs a base URL set in Providers before it can be
          used.
        </div>
      )}

      <div className="flex flex-col gap-1.5">
        <label className="text-xs text-[var(--color-muted)]">
          {config.label} API key
        </label>
        <div className="relative">
          <Input
            type={showKey ? "text" : "password"}
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="sk-... or similar — skipping is fine, you can add it later"
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
      </div>

      <StepFooter
        onNext={onSaveAndContinue}
        nextLabel={apiKey.trim() ? "Save & continue" : "Skip for now"}
        secondary={
          <Button
            variant="secondary"
            size="sm"
            disabled={!apiKey.trim() || busy !== null}
            onClick={onTest}
          >
            {busy === "test" ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <Check className="size-3.5" />
            )}
            Test
          </Button>
        }
      />
    </StepFrame>
  );
}

function RemotionStep({ onNext }: { onNext: () => void }) {
  const eligible = useSettingsStore((s) => s.remotionEligibleFree);
  const setEligible = useSettingsStore((s) => s.setRemotionEligibleFree);
  const companyKey = useSettingsStore((s) => s.remotionCompanyLicenseKey);
  const setCompanyKey = useSettingsStore(
    (s) => s.setRemotionCompanyLicenseKey,
  );

  return (
    <StepFrame
      icon={<Video className="size-6 text-white" />}
      eyebrow="Step 3 of 3"
      title="Remotion license"
      subtitle={
        <>
          Free for individuals, companies with 3 people or fewer, and
          non-profits. A Company License is required otherwise. See{" "}
          <a
            href="https://github.com/remotion-dev/remotion/blob/main/LICENSE.md"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 text-[var(--color-accent)] underline-offset-2 hover:underline"
          >
            LICENSE.md
            <ExternalLink className="size-3" />
          </a>
          .
        </>
      }
    >
      <div className="flex items-center justify-between rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)]/40 p-3">
        <div>
          <div className="text-sm font-medium">I qualify for the Free License</div>
          <div className="text-xs text-[var(--color-muted)]">
            Renderer uses{" "}
            <code className="rounded bg-[var(--color-bg)]/60 px-1 py-0.5 font-mono text-[11px]">
              licenseKey: "free-license"
            </code>
            .
          </div>
        </div>
        <Switch checked={eligible} onCheckedChange={setEligible} />
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-xs text-[var(--color-muted)]">
          Company License Key (optional)
        </label>
        <Input
          value={companyKey ?? ""}
          onChange={(e) => setCompanyKey(e.target.value || null)}
          placeholder="paste your company license key"
          spellCheck={false}
          className="font-mono text-xs"
        />
      </div>

      <StepFooter onNext={onNext} nextLabel="Continue" />
    </StepFrame>
  );
}

function DoneStep({ onFinish }: { onFinish: () => void }) {
  return (
    <StepFrame
      icon={<Check className="size-6 text-white" />}
      eyebrow="All set"
      title="Ready to create"
      subtitle="Press Ctrl+K anytime to open the command palette. Have fun!"
    >
      <div className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)]/40 p-3 text-xs text-[var(--color-muted)]">
        <div className="mb-1 font-semibold text-[var(--color-foreground)]">
          Quick tips
        </div>
        <ul className="list-inside list-disc space-y-0.5">
          <li>Ctrl+K — Command palette</li>
          <li>Ctrl+N — New chat</li>
          <li>Ctrl+B — Toggle sidebar</li>
          <li>Ctrl+, — Open Settings</li>
        </ul>
      </div>
      <StepFooter onNext={onFinish} nextLabel="Enter the studio" />
    </StepFrame>
  );
}

/* -------------------------------------------------------------------------- */
/* Shared bits                                                                 */
/* -------------------------------------------------------------------------- */

function StepFrame({
  icon,
  eyebrow,
  title,
  subtitle,
  children,
}: {
  icon: React.ReactNode;
  eyebrow: string;
  title: string;
  subtitle?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -6 }}
      transition={{ duration: 0.18, ease: "easeOut" }}
      className="flex flex-col gap-4"
    >
      <div className="flex items-start gap-4">
        <div className="grid size-11 shrink-0 place-items-center rounded-[var(--radius-md)] gradient-accent shadow-[var(--shadow-glow)]">
          {icon}
        </div>
        <div>
          <div className="text-[10px] font-semibold uppercase tracking-wider text-[var(--color-accent)]">
            {eyebrow}
          </div>
          <h2 className="text-xl font-semibold tracking-tight">
            <span className="gradient-text">{title}</span>
          </h2>
          {subtitle && (
            <p className="mt-1 text-sm text-[var(--color-muted)]">
              {subtitle}
            </p>
          )}
        </div>
      </div>
      {children}
    </motion.div>
  );
}

function StepFooter({
  onNext,
  nextLabel = "Continue",
  secondary,
}: {
  onNext: () => void;
  nextLabel?: string;
  secondary?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-end gap-2 pt-2">
      {secondary}
      <Button onClick={onNext} size="sm">
        {nextLabel}
        <ArrowRight className="size-3.5" />
      </Button>
    </div>
  );
}

function FeatureTile({
  icon,
  label,
  detail,
}: {
  icon: React.ReactNode;
  label: string;
  detail: string;
}) {
  return (
    <div className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)]/40 p-3">
      <div className="mb-1 flex items-center gap-2 text-xs font-medium text-[var(--color-foreground)]">
        <span className="text-[var(--color-accent)]">{icon}</span>
        {label}
      </div>
      <div className="text-[11px] text-[var(--color-muted)]">{detail}</div>
    </div>
  );
}
