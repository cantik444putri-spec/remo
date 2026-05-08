import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PageShell } from "./_PageShell";
import {
  ACCENT_PRESETS,
  type AccentKey,
  useSettingsStore,
} from "@/stores/settings";
import { cn } from "@/lib/utils";
import {
  detectBackend,
  type KeystoreBackend,
} from "@/lib/keystore";
import { RotateCcw, ShieldAlert, ShieldCheck } from "lucide-react";

const SHORTCUTS: Array<{ keys: string; label: string }> = [
  { keys: "Ctrl + K", label: "Open command palette" },
  { keys: "Ctrl + B", label: "Toggle main sidebar" },
  { keys: "Ctrl + ,", label: "Open Settings" },
  { keys: "Ctrl + N", label: "New conversation" },
  { keys: "Enter", label: "Send message (Shift+Enter = newline)" },
  { keys: "Esc", label: "Cancel message edit" },
  { keys: "Double-click", label: "Rename conversation in list" },
  { keys: "Ctrl + R", label: "Render project (M8)" },
  { keys: "Space", label: "Play / pause preview (M6)" },
];

export function SettingsPage() {
  const theme = useSettingsStore((s) => s.theme);
  const toggleTheme = useSettingsStore((s) => s.toggleTheme);
  const accent = useSettingsStore((s) => s.accent);
  const setAccent = useSettingsStore((s) => s.setAccent);
  const setOnboarded = useSettingsStore((s) => s.setOnboarded);
  const remotionEligibleFree = useSettingsStore((s) => s.remotionEligibleFree);
  const setRemotionEligibleFree = useSettingsStore(
    (s) => s.setRemotionEligibleFree,
  );
  const companyKey = useSettingsStore((s) => s.remotionCompanyLicenseKey);
  const setCompanyKey = useSettingsStore(
    (s) => s.setRemotionCompanyLicenseKey,
  );

  const [backend, setBackend] = useState<KeystoreBackend | null>(null);
  useEffect(() => {
    detectBackend().then(setBackend);
  }, []);
  const secure = backend === "windows-credential-manager";

  return (
    <PageShell
      title="Settings"
      description="Appearance, keyboard, security, and Remotion license configuration."
      badge="M5 · live"
    >
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Appearance */}
        <Card>
          <CardHeader>
            <CardTitle>Appearance</CardTitle>
            <CardDescription>
              Dark theme, OLED true-black, and accent gradient.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4 pt-2">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium">OLED true-black</div>
                <div className="text-xs text-[var(--color-muted)]">
                  Pure black background. Great for OLED displays.
                </div>
              </div>
              <Switch checked={theme === "oled"} onCheckedChange={toggleTheme} />
            </div>

            <div>
              <div className="mb-2 text-sm font-medium">Accent</div>
              <div className="flex flex-wrap gap-2">
                {(Object.entries(ACCENT_PRESETS) as [
                  AccentKey,
                  (typeof ACCENT_PRESETS)[AccentKey],
                ][]).map(([key, preset]) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setAccent(key)}
                    className={cn(
                      "group flex items-center gap-2 rounded-[var(--radius-md)] border px-3 py-1.5 text-xs transition-all",
                      accent === key
                        ? "border-[var(--color-accent)] bg-[var(--color-surface)]"
                        : "border-[var(--color-border)] bg-[var(--color-surface)]/40 hover:bg-[var(--color-surface)]",
                    )}
                  >
                    <span
                      className="size-3 rounded-full"
                      style={{
                        background: `linear-gradient(135deg, hsl(${preset.from}), hsl(${preset.to}))`,
                      }}
                    />
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Shortcuts */}
        <Card>
          <CardHeader>
            <CardTitle>Keyboard shortcuts</CardTitle>
            <CardDescription>
              Global combos registered by the shell.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-1 pt-2">
            {SHORTCUTS.map((s) => (
              <div
                key={s.keys}
                className="flex items-center justify-between rounded-[var(--radius-sm)] px-2 py-1.5 text-xs hover:bg-[var(--color-surface)]/60"
              >
                <span className="text-[var(--color-muted)]">{s.label}</span>
                <kbd className="rounded border border-[var(--color-border)] bg-[var(--color-surface)]/80 px-2 py-0.5 font-mono text-[11px] text-[var(--color-foreground)]">
                  {s.keys}
                </kbd>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Security */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Security</CardTitle>
            <CardDescription>
              Where your API keys actually live.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3 pt-2">
            <div
              className={cn(
                "flex items-start gap-3 rounded-[var(--radius-md)] border p-3 text-xs",
                secure
                  ? "border-emerald-500/30 bg-emerald-500/5 text-emerald-200"
                  : "border-amber-500/30 bg-amber-500/5 text-amber-200",
              )}
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
                      : "Detecting..."}
                </div>
                <div className="text-[var(--color-muted)]">
                  {secure
                    ? "API keys are stored by the OS under service Remotion Studio Tools Microstock. The renderer never sees the secret once saved."
                    : backend === "localstorage-fallback"
                      ? "You're running outside Tauri. Keys are kept in browser localStorage for development only. Run npm run tauri:dev for the secure backend."
                      : ""}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)]/40 px-3 py-2">
              <div>
                <div className="text-sm font-medium">Onboarding</div>
                <div className="text-xs text-[var(--color-muted)]">
                  Replay the first-run guided tour.
                </div>
              </div>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  setOnboarded(false);
                  toast("Onboarding restarted");
                }}
              >
                <RotateCcw className="size-3.5" />
                Restart
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Remotion license */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Remotion License</CardTitle>
            <CardDescription>
              Free for individuals and companies with 3 people or fewer, and for
              non-profits. Company License required otherwise. See Remotion
              LICENSE.md for details.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4 pt-2">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium">
                  I qualify for the Free License
                </div>
                <div className="text-xs text-[var(--color-muted)]">
                  Renderer will be invoked with{" "}
                  <code className="rounded bg-[var(--color-bg)]/60 px-1 py-0.5 font-mono text-[11px]">
                    licenseKey: "free-license"
                  </code>
                  .
                </div>
              </div>
              <Switch
                checked={remotionEligibleFree}
                onCheckedChange={setRemotionEligibleFree}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-[var(--color-muted)]">
                Company License Key (optional)
              </label>
              <Input
                type="text"
                value={companyKey ?? ""}
                onChange={(e) => setCompanyKey(e.target.value || null)}
                placeholder="paste your company license key"
                spellCheck={false}
                className="font-mono text-xs"
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </PageShell>
  );
}
