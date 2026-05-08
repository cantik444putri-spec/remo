import { useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import {
  ArrowRight,
  Check,
  Loader2,
  RefreshCw,
  Sparkles,
  Square,
  Wand2,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { useStudioStore } from "@/stores/studio";
import { useProviderStore } from "@/stores/providers";
import { getPreset } from "@/remotion/presets";
import {
  generateStoryboard,
  storyboardToComposition,
  type Storyboard,
} from "@/lib/storyboard";

const PROMPT_SUGGESTIONS = [
  "Cinematic intro for a sunrise timelapse travel video, moody and poetic.",
  "Broadcast-style HUD intro for a 3-minute gaming highlights reel.",
  "Soft pastel product reveal for a handcrafted jewelry line.",
  "Sci-fi dashboard teaser for an AI startup launch.",
  "Minimalist wedding save-the-date with serif typography.",
];

/**
 * AI storyboard side panel. Docks on the right side of the Studio when
 * open, overlaying the Inspector via z-index. Generates a storyboard via
 * the active AI provider, streams tokens into a live preview, and lets
 * the user Apply (writes to the composition) or Discard (keeps existing).
 */
export function StoryboardPanel() {
  const open = useStudioStore((s) => s.storyboardPanelOpen);
  const setOpen = useStudioStore((s) => s.setStoryboardPanelOpen);
  const pending = useStudioStore((s) => s.pendingStoryboard);
  const setPending = useStudioStore((s) => s.setPendingStoryboard);
  const lastPrompt = useStudioStore((s) => s.lastStoryboardPrompt);
  const setLastPrompt = useStudioStore((s) => s.setLastStoryboardPrompt);
  const applyComposition = useStudioStore((s) => s.applyComposition);
  const composition = useStudioStore((s) => s.composition);
  const presetId = useStudioStore((s) => s.presetId);
  const activeProvider = useProviderStore((s) => s.activeProvider);
  const hasKey = useProviderStore((s) => s.hasKey[s.activeProvider]);
  const configLabel = useProviderStore(
    (s) => s.configs[s.activeProvider].label,
  );
  const activeModel = useProviderStore((s) => s.activeModel);

  const preset = useMemo(() => getPreset(presetId), [presetId]);

  const [prompt, setPrompt] = useState(lastPrompt);
  const [rawStream, setRawStream] = useState("");
  const [busy, setBusy] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const onGenerate = async () => {
    const trimmed = prompt.trim();
    if (!trimmed) return;
    if (!hasKey) {
      toast.error(`No API key for ${configLabel}`, {
        description: "Add one in Providers first.",
      });
      return;
    }
    setBusy(true);
    setRawStream("");
    setPending(null);
    setLastPrompt(trimmed);
    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const storyboard = await generateStoryboard({
        prompt: trimmed,
        presetLabel: preset.label,
        fps: preset.fps,
        supportsAlpha: preset.supportsAlpha,
        signal: controller.signal,
        onToken: (chunk) => setRawStream((prev) => prev + chunk),
      });
      setPending(storyboard);
      toast.success("Storyboard ready", {
        description: "Review and Apply to push to the composition.",
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Generation failed";
      if (msg !== "Cancelled") {
        toast.error("Storyboard failed", { description: msg });
      }
    } finally {
      abortRef.current = null;
      setBusy(false);
    }
  };

  const onCancel = () => {
    abortRef.current?.abort();
  };

  const onApply = () => {
    if (!pending) return;
    const next = storyboardToComposition(pending, preset.fps, composition);
    applyComposition(next);
    setPending(null);
    setRawStream("");
    toast.success("Applied to composition");
  };

  const onDiscard = () => {
    setPending(null);
    setRawStream("");
  };

  return (
    <AnimatePresence initial={false}>
      {open && (
        <motion.aside
          initial={{ x: "100%", opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: "100%", opacity: 0 }}
          transition={{ duration: 0.24, ease: "easeOut" }}
          className="absolute inset-y-0 right-0 z-20 flex w-[360px] shrink-0 flex-col border-l border-[var(--color-border)] bg-[var(--color-bg)]/95 backdrop-blur-xl"
        >
          <header className="flex items-center justify-between border-b border-[var(--color-border)] px-3 py-2">
            <div className="flex items-center gap-2 text-xs font-medium">
              <Wand2 className="size-3.5 text-[var(--color-accent)]" />
              AI Storyboard
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close storyboard panel"
              className="rounded p-1 text-[var(--color-muted)] hover:bg-[var(--color-surface)] hover:text-[var(--color-foreground)]"
            >
              <X className="size-4" />
            </button>
          </header>

          <div className="flex flex-1 flex-col gap-3 overflow-y-auto p-3">
            {/* Provider badge */}
            <div className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)]/40 px-3 py-2 text-[11px]">
              <div className="flex items-center gap-2">
                <span
                  className={cn(
                    "size-1.5 rounded-full",
                    hasKey
                      ? "bg-emerald-400 shadow-[0_0_6px_theme(colors.emerald.400)]"
                      : "bg-amber-400",
                  )}
                />
                <span className="font-medium">
                  {configLabel} · {activeModel || "(no model)"}
                </span>
                <span className="ml-auto font-mono text-[10px] text-[var(--color-muted)]">
                  {activeProvider}
                </span>
              </div>
              <div className="mt-0.5 text-[10px] text-[var(--color-muted)]">
                JSON-mode request · temp 0.4 · target {preset.fps}fps
              </div>
            </div>

            {/* Prompt */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] uppercase tracking-wider text-[var(--color-muted)]">
                Brief
              </label>
              <Textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Describe the video you want: mood, niche, key words, duration..."
                className="min-h-[96px] text-xs"
                disabled={busy}
                onKeyDown={(e) => {
                  if (
                    (e.metaKey || e.ctrlKey) &&
                    e.key === "Enter" &&
                    !busy &&
                    prompt.trim()
                  ) {
                    e.preventDefault();
                    void onGenerate();
                  }
                }}
              />
              <div className="flex flex-wrap gap-1">
                {PROMPT_SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setPrompt(s)}
                    disabled={busy}
                    className="rounded-full border border-[var(--color-border)] bg-[var(--color-surface)]/40 px-2 py-0.5 text-[10px] text-[var(--color-muted)] transition-colors hover:bg-[var(--color-surface)] hover:text-[var(--color-foreground)] disabled:opacity-50"
                  >
                    {s.slice(0, 40)}…
                  </button>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
              {!busy ? (
                <Button
                  size="sm"
                  onClick={onGenerate}
                  disabled={!prompt.trim() || !hasKey}
                  className="flex-1"
                >
                  <Sparkles className="size-3.5" />
                  Generate
                </Button>
              ) : (
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={onCancel}
                  className="flex-1"
                >
                  <Square className="size-3.5 fill-current" />
                  Stop
                </Button>
              )}
              {!busy && prompt === lastPrompt && lastPrompt && !pending && (
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={onGenerate}
                  title="Regenerate"
                >
                  <RefreshCw className="size-3.5" />
                </Button>
              )}
            </div>

            {/* Streaming buffer */}
            {busy && rawStream && (
              <StreamingFrame raw={rawStream} />
            )}

            {/* Pending storyboard preview */}
            {pending && !busy && (
              <StoryboardPreview storyboard={pending} />
            )}

            {/* Apply / discard */}
            {pending && !busy && (
              <div className="sticky bottom-0 -mx-3 -mb-3 flex items-center gap-2 border-t border-[var(--color-border)] bg-[var(--color-bg)]/95 p-3">
                <Button size="sm" onClick={onApply} className="flex-1">
                  <Check className="size-3.5" />
                  Apply to composition
                </Button>
                <Button size="sm" variant="ghost" onClick={onDiscard}>
                  Discard
                </Button>
              </div>
            )}

            {/* Idle help */}
            {!pending && !busy && !rawStream && (
              <div className="text-[10px] text-[var(--color-muted)]">
                The AI returns a structured storyboard. Nothing is applied
                until you click Apply. Press{" "}
                <kbd className="rounded border border-[var(--color-border)] bg-[var(--color-surface)]/80 px-1 font-mono text-[10px]">
                  Ctrl
                </kbd>{" "}
                +{" "}
                <kbd className="rounded border border-[var(--color-border)] bg-[var(--color-surface)]/80 px-1 font-mono text-[10px]">
                  Enter
                </kbd>{" "}
                to generate.
              </div>
            )}
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  );
}

function StreamingFrame({ raw }: { raw: string }) {
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-[var(--color-muted)]">
        <Loader2 className="size-3 animate-spin" />
        Streaming JSON…
      </div>
      <pre className="max-h-64 overflow-auto rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-bg)]/60 p-2 font-mono text-[10px] leading-[1.4] text-[var(--color-muted)]">
        {raw}
      </pre>
    </div>
  );
}

function StoryboardPreview({ storyboard }: { storyboard: Storyboard }) {
  const rows: Array<{ key: string; label: string; value: string }> = [
    { key: "title", label: "Heading", value: storyboard.title.heading },
    {
      key: "subtitle",
      label: "Subtitle",
      value: storyboard.title.subtitle ?? "—",
    },
    {
      key: "lt-name",
      label: "Lower-third",
      value: `${storyboard.lowerThird.name}${
        storyboard.lowerThird.tagline ? ` · ${storyboard.lowerThird.tagline}` : ""
      }${
        storyboard.lowerThird.position ? ` (${storyboard.lowerThird.position})` : ""
      }`,
    },
    {
      key: "outro",
      label: "Outro",
      value: `${storyboard.outro.heading} → ${storyboard.outro.callToAction}`,
    },
    {
      key: "hud",
      label: "HUD",
      value: storyboard.hud.enabled
        ? `${storyboard.hud.label}${
            storyboard.hud.accentColor ? ` · ${storyboard.hud.accentColor}` : ""
          }`
        : "disabled",
    },
    {
      key: "particles",
      label: "Particles",
      value: storyboard.particles.enabled
        ? `on · ${storyboard.particles.count ?? 180}`
        : "off",
    },
    {
      key: "timing",
      label: "Timing",
      value: `${storyboard.timing.titleDurationSeconds.toFixed(1)}s + ${storyboard.timing.outroDurationSeconds.toFixed(1)}s`,
    },
    {
      key: "bg",
      label: "Background",
      value: storyboard.transparentBackground
        ? "transparent"
        : storyboard.backgroundColor ?? "default",
    },
  ];

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-[var(--color-accent)]">
        <ArrowRight className="size-3" />
        Draft ready
      </div>
      <dl className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)]/40 text-[11px]">
        {rows.map((r, i) => (
          <div
            key={r.key}
            className={cn(
              "flex items-start gap-2 px-2.5 py-1.5",
              i > 0 && "border-t border-[var(--color-border)]",
            )}
          >
            <dt className="w-20 shrink-0 text-[10px] uppercase tracking-wider text-[var(--color-muted)]">
              {r.label}
            </dt>
            <dd className="flex-1 whitespace-pre-wrap break-words">{r.value}</dd>
          </div>
        ))}
      </dl>
      {storyboard.notes && (
        <div className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)]/40 p-2 text-[10px] leading-relaxed text-[var(--color-muted)]">
          {storyboard.notes}
        </div>
      )}
    </div>
  );
}
