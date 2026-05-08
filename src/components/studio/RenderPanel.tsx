import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { ChevronDown, Download, FileVideo, Info, Play, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useStudioStore } from "@/stores/studio";
import { useSettingsStore } from "@/stores/settings";
import { RENDER_PRESETS, getPreset } from "@/remotion/presets";

/**
 * Left-panel render controls: preset picker + Render button. The actual
 * render pipeline (spawning the Remotion CLI from Rust) lands in M8;
 * until then, the button explains what will happen and queues a stub.
 */
export function RenderPanel() {
  const presetId = useStudioStore((s) => s.presetId);
  const setPreset = useStudioStore((s) => s.setPreset);
  const composition = useStudioStore((s) => s.composition);
  const eligibleFree = useSettingsStore((s) => s.remotionEligibleFree);
  const companyKey = useSettingsStore((s) => s.remotionCompanyLicenseKey);

  const [expanded, setExpanded] = useState(false);
  const preset = useMemo(() => getPreset(presetId), [presetId]);

  const licenseLabel = eligibleFree
    ? "free-license"
    : companyKey
      ? `company · ${companyKey.slice(0, 6)}…`
      : "UNSET";
  const licenseWarn = !eligibleFree && !companyKey;

  const onRender = () => {
    toast.info("Render pipeline lands in M8", {
      description: `${preset.label} · ${composition.titleDuration + composition.outroDuration}f @ ${preset.fps}fps · ${preset.extension}`,
      duration: 3200,
    });
  };

  return (
    <aside className="flex h-full w-[260px] shrink-0 flex-col overflow-hidden border-r border-[var(--color-border)] bg-[var(--color-bg)]/30">
      <header className="flex items-center gap-2 border-b border-[var(--color-border)] px-3 py-2 text-xs font-medium">
        <FileVideo className="size-3.5 text-[var(--color-accent)]" />
        Render
      </header>

      <div className="flex flex-1 flex-col gap-3 overflow-y-auto p-3">
        {/* Current selection */}
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="flex items-center justify-between rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)]/60 px-3 py-2 text-left text-xs hover:bg-[var(--color-surface)]"
        >
          <div className="min-w-0">
            <div className="truncate font-medium">{preset.label}</div>
            <div className="mt-0.5 font-mono text-[10px] text-[var(--color-muted)]">
              {preset.width}×{preset.height} · {preset.fps}fps · .{preset.extension}
            </div>
          </div>
          <ChevronDown
            className={cn(
              "size-3.5 shrink-0 text-[var(--color-muted)] transition-transform",
              expanded && "rotate-180",
            )}
          />
        </button>

        <AnimatePresence initial={false}>
          {expanded && (
            <motion.ul
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.18 }}
              className="flex flex-col gap-1 overflow-hidden"
            >
              {RENDER_PRESETS.map((p) => (
                <li key={p.id}>
                  <button
                    type="button"
                    onClick={() => {
                      setPreset(p.id);
                      setExpanded(false);
                      toast(`Preset: ${p.label}`, { duration: 1200 });
                    }}
                    className={cn(
                      "flex w-full flex-col items-start gap-0.5 rounded-[var(--radius-md)] border px-2.5 py-1.5 text-left text-[11px] transition-colors",
                      p.id === presetId
                        ? "border-[var(--color-accent)] bg-[var(--color-surface)]"
                        : "border-[var(--color-border)] bg-[var(--color-surface)]/40 hover:bg-[var(--color-surface)]",
                    )}
                  >
                    <span className="flex w-full items-center gap-1">
                      <span className="truncate font-medium text-[var(--color-foreground)]">
                        {p.label}
                      </span>
                      {p.recommended && (
                        <span className="ml-auto shrink-0 rounded bg-[var(--color-accent)]/15 px-1 text-[9px] uppercase tracking-wider text-[var(--color-accent)]">
                          default
                        </span>
                      )}
                      {p.supportsAlpha && (
                        <span className="shrink-0 rounded bg-emerald-400/15 px-1 text-[9px] uppercase tracking-wider text-emerald-300">
                          alpha
                        </span>
                      )}
                    </span>
                    <span className="text-[10px] text-[var(--color-muted)]">
                      {p.description}
                    </span>
                  </button>
                </li>
              ))}
            </motion.ul>
          )}
        </AnimatePresence>

        {/* Remotion license strip */}
        <div
          className={cn(
            "flex items-start gap-2 rounded-[var(--radius-md)] border p-2 text-[10px]",
            licenseWarn
              ? "border-amber-500/30 bg-amber-500/5 text-amber-200"
              : "border-[var(--color-border)] bg-[var(--color-surface)]/40 text-[var(--color-muted)]",
          )}
        >
          <Info className="mt-0.5 size-3 shrink-0" />
          <div>
            <div className="font-medium text-[var(--color-foreground)]">
              Remotion license
            </div>
            <div className="font-mono">{licenseLabel}</div>
            {licenseWarn && (
              <div className="mt-1">
                Enable Free eligibility or paste a Company License Key in
                Settings before rendering.
              </div>
            )}
          </div>
        </div>

        <div className="mt-auto flex flex-col gap-2">
          <Button onClick={onRender} size="sm" disabled={licenseWarn}>
            <Download className="size-3.5" />
            Render
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => useStudioStore.getState().setStoryboardPanelOpen(true)}
          >
            <Sparkles className="size-3.5" />
            Generate with AI
          </Button>
          <div className="flex items-center gap-1.5 text-[10px] text-[var(--color-muted)]">
            <Play className="size-3" />
            Tip: press Space in the Player to play/pause.
          </div>
        </div>
      </div>
    </aside>
  );
}
