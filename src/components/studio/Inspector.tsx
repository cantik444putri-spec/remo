import { useMemo } from "react";
import {
  AlignLeft,
  Image as ImageIcon,
  Layers,
  Radar,
  SlidersHorizontal,
  Sparkles,
  Type,
  UserRound,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { useStudioStore, type StudioState } from "@/stores/studio";
import { getPreset } from "@/remotion/presets";
import { cn } from "@/lib/utils";

const SAFE_AREAS: { id: StudioState["safeArea"]; label: string }[] = [
  { id: "off", label: "Off" },
  { id: "tv", label: "TV 5%" },
  { id: "instagram", label: "IG" },
  { id: "tiktok", label: "TikTok" },
];

/**
 * Right-panel inspector for live-editing the Main composition. Every
 * control writes straight to the Zustand store so the Player re-renders
 * immediately via inputProps.
 */
export function Inspector() {
  const composition = useStudioStore((s) => s.composition);
  const setComposition = useStudioStore((s) => s.setComposition);
  const setTitle = useStudioStore((s) => s.setTitle);
  const setLowerThird = useStudioStore((s) => s.setLowerThird);
  const setOutro = useStudioStore((s) => s.setOutro);
  const setHud = useStudioStore((s) => s.setHud);
  const setParticles = useStudioStore((s) => s.setParticles);
  const presetId = useStudioStore((s) => s.presetId);
  const safeArea = useStudioStore((s) => s.safeArea);
  const setSafeArea = useStudioStore((s) => s.setSafeArea);
  const reset = useStudioStore((s) => s.reset);

  const preset = useMemo(() => getPreset(presetId), [presetId]);
  const supportsAlpha = preset.supportsAlpha;

  return (
    <aside className="flex h-full w-[320px] shrink-0 flex-col overflow-y-auto border-l border-[var(--color-border)] bg-[var(--color-bg)]/30">
      <header className="flex items-center justify-between border-b border-[var(--color-border)] px-3 py-2">
        <div className="flex items-center gap-2 text-xs font-medium">
          <SlidersHorizontal className="size-3.5 text-[var(--color-accent)]" />
          Inspector
        </div>
        <Button variant="ghost" size="sm" onClick={reset} className="text-[10px]">
          Reset
        </Button>
      </header>

      <div className="flex flex-col gap-6 p-4">
        {/* Output canvas */}
        <Section icon={<Layers className="size-3.5" />} title="Canvas">
          <div className="text-[10px] text-[var(--color-muted)]">
            Selected preset controls canvas size and fps. Change it in the Render panel.
          </div>
          <div className="mt-1 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)]/40 p-2 text-[11px]">
            <div className="font-medium">{preset.label}</div>
            <div className="mt-0.5 font-mono text-[10px] text-[var(--color-muted)]">
              {preset.width} × {preset.height} · {preset.fps}fps
            </div>
          </div>

          <Row label="Transparent background">
            <Switch
              checked={composition.transparentBackground}
              onCheckedChange={(v) =>
                setComposition({ transparentBackground: v })
              }
              disabled={!supportsAlpha && !composition.transparentBackground}
            />
          </Row>
          {!supportsAlpha && (
            <div className="text-[10px] text-amber-300/80">
              Current preset does not export alpha. Switch to ProRes 4444 or
              WebM alpha to bake transparency into the file.
            </div>
          )}
          <Row label="Background color">
            <input
              type="color"
              disabled={composition.transparentBackground}
              value={composition.backgroundColor}
              onChange={(e) => setComposition({ backgroundColor: e.target.value })}
              className="h-7 w-14 cursor-pointer rounded border border-[var(--color-border)] bg-transparent p-0 disabled:opacity-40"
            />
          </Row>

          <Row label="Safe area">
            <div className="flex rounded-[var(--radius-md)] border border-[var(--color-border)] p-0.5 text-[10px]">
              {SAFE_AREAS.map((o) => (
                <button
                  key={o.id}
                  type="button"
                  onClick={() => setSafeArea(o.id)}
                  className={cn(
                    "rounded px-2 py-0.5",
                    safeArea === o.id
                      ? "bg-[var(--color-surface)] text-[var(--color-foreground)]"
                      : "text-[var(--color-muted)] hover:text-[var(--color-foreground)]",
                  )}
                >
                  {o.label}
                </button>
              ))}
            </div>
          </Row>
        </Section>

        {/* Timeline */}
        <Section icon={<SlidersHorizontal className="size-3.5" />} title="Timing">
          <Row label={`Title ${framesToSec(composition.titleDuration, preset.fps)}`}>
            <span className="font-mono text-[10px] text-[var(--color-muted)]">
              {composition.titleDuration}f
            </span>
          </Row>
          <Slider
            value={[composition.titleDuration]}
            min={30}
            max={600}
            step={15}
            onValueChange={(v) =>
              setComposition({ titleDuration: v[0] ?? mainFallback })
            }
          />
          <Row label={`Outro ${framesToSec(composition.outroDuration, preset.fps)}`}>
            <span className="font-mono text-[10px] text-[var(--color-muted)]">
              {composition.outroDuration}f
            </span>
          </Row>
          <Slider
            value={[composition.outroDuration]}
            min={30}
            max={600}
            step={15}
            onValueChange={(v) =>
              setComposition({ outroDuration: v[0] ?? mainFallback })
            }
          />
        {/* Transition duration row at end of Timing section */}
          <div className="text-[10px] text-[var(--color-muted)]">
            Total:{" "}
            <span className="font-mono text-[var(--color-foreground)]">
              {composition.titleDuration + composition.outroDuration}f (
              {framesToSec(
                composition.titleDuration + composition.outroDuration,
                preset.fps,
              )}
              )
            </span>
          </div>
          <Row label={`Transition ${framesToSec(composition.transitionDuration, preset.fps)}`}>
            <span className="font-mono text-[10px] text-[var(--color-muted)]">
              {composition.transitionDuration}f
            </span>
          </Row>
          <Slider
            value={[composition.transitionDuration]}
            min={6}
            max={90}
            step={3}
            onValueChange={(v) =>
              setComposition({ transitionDuration: v[0] ?? 30 })
            }
          />
        </Section>

        {/* Title card */}
        <Section icon={<Type className="size-3.5" />} title="Title card">
          <LabeledInput
            label="Heading"
            value={composition.title.title}
            onChange={(v) => setTitle({ title: v })}
            multiline
          />
          <LabeledInput
            label="Subtitle"
            value={composition.title.subtitle ?? ""}
            onChange={(v) => setTitle({ subtitle: v })}
            multiline
          />
        </Section>

        {/* Lower third */}
        <Section icon={<UserRound className="size-3.5" />} title="Lower third">
          <LabeledInput
            label="Name"
            value={composition.lowerThird.name}
            onChange={(v) => setLowerThird({ name: v })}
          />
          <LabeledInput
            label="Tagline"
            value={composition.lowerThird.tagline ?? ""}
            onChange={(v) => setLowerThird({ tagline: v })}
          />
          <Row label="Position">
            <div className="flex rounded-[var(--radius-md)] border border-[var(--color-border)] p-0.5 text-[10px]">
              {(["left", "right"] as const).map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setLowerThird({ position: p })}
                  className={cn(
                    "rounded px-2 py-0.5 capitalize",
                    composition.lowerThird.position === p
                      ? "bg-[var(--color-surface)] text-[var(--color-foreground)]"
                      : "text-[var(--color-muted)]",
                  )}
                >
                  {p}
                </button>
              ))}
            </div>
          </Row>
        </Section>

        {/* Outro */}
        <Section icon={<ImageIcon className="size-3.5" />} title="Outro CTA">
          <LabeledInput
            label="Heading"
            value={composition.outro.heading}
            onChange={(v) => setOutro({ heading: v })}
            multiline
          />
          <LabeledInput
            label="Call to action"
            value={composition.outro.callToAction}
            onChange={(v) => setOutro({ callToAction: v })}
          />
        </Section>

        {/* HUD overlay */}
        <Section icon={<Radar className="size-3.5" />} title="HUD overlay">
          <Row label="Enabled">
            <Switch
              checked={composition.showHud}
              onCheckedChange={(v) => setComposition({ showHud: v })}
            />
          </Row>
          <LabeledInput
            label="Label"
            value={composition.hud.label}
            onChange={(v) => setHud({ label: v })}
          />
          <Row label="Accent">
            <input
              type="color"
              value={composition.hud.accentColor ?? "#a855f7"}
              onChange={(e) => setHud({ accentColor: e.target.value })}
              className="h-7 w-14 cursor-pointer rounded border border-[var(--color-border)] bg-transparent p-0"
            />
          </Row>
        </Section>

        {/* Particle backdrop */}
        <Section icon={<Sparkles className="size-3.5" />} title="Particle backdrop">
          <Row label="Enabled">
            <Switch
              checked={composition.showParticles}
              onCheckedChange={(v) => setComposition({ showParticles: v })}
            />
          </Row>
          <Row label={`Count ${composition.particles.count ?? 180}`}>
            <span className="font-mono text-[10px] text-[var(--color-muted)]" />
          </Row>
          <Slider
            value={[composition.particles.count ?? 180]}
            min={40}
            max={600}
            step={10}
            onValueChange={(v) => setParticles({ count: v[0] ?? 180 })}
          />
        </Section>

        <Section icon={<AlignLeft className="size-3.5" />} title="Notes">
          <div className="text-[10px] text-[var(--color-muted)]">
            M7 will add AI storyboard generation — prompt in Chat, props
            will apply here instantly.
          </div>
        </Section>
      </div>
    </aside>
  );
}

const mainFallback = 150;

function framesToSec(frames: number, fps: number): string {
  const sec = frames / fps;
  if (sec < 1) return `${Math.round(sec * 1000)}ms`;
  return `${sec.toFixed(2)}s`;
}

function Section({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="flex flex-col gap-2">
      <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-wider text-[var(--color-muted)]">
        {icon}
        {title}
      </div>
      {children}
    </section>
  );
}

function Row({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-2 text-xs">
      <span className="text-[var(--color-muted)]">{label}</span>
      {children}
    </div>
  );
}

function LabeledInput({
  label,
  value,
  onChange,
  multiline,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  multiline?: boolean;
}) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-[10px] text-[var(--color-muted)]">{label}</span>
      {multiline ? (
        <Textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="min-h-[48px] text-xs"
        />
      ) : (
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="text-xs"
        />
      )}
    </div>
  );
}
