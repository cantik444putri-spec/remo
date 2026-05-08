import type { StudioState } from "@/stores/studio";

interface SafeAreaOverlayProps {
  mode: Exclude<StudioState["safeArea"], "off">;
}

/**
 * Non-interactive overlay showing platform-specific safe areas on top of
 * the Player. Percentages chosen to match each platform's guidance so
 * creators can avoid UI chrome clipping title / CTA elements.
 */
export function SafeAreaOverlay({ mode }: SafeAreaOverlayProps) {
  const { topPct, bottomPct, label } = getSafeArea(mode);
  return (
    <div className="pointer-events-none absolute inset-0">
      <div
        className="absolute inset-x-0 top-0 border-b border-dashed border-amber-400/60 bg-amber-400/5"
        style={{ height: `${topPct}%` }}
      />
      <div
        className="absolute inset-x-0 bottom-0 border-t border-dashed border-amber-400/60 bg-amber-400/5"
        style={{ height: `${bottomPct}%` }}
      />
      <div className="absolute left-2 top-2 rounded bg-black/60 px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-amber-300">
        {label}
      </div>
    </div>
  );
}

function getSafeArea(mode: Exclude<StudioState["safeArea"], "off">): {
  topPct: number;
  bottomPct: number;
  label: string;
} {
  switch (mode) {
    case "tv":
      return { topPct: 5, bottomPct: 5, label: "TV safe · 5%" };
    case "instagram":
      return { topPct: 12, bottomPct: 18, label: "Instagram safe" };
    case "tiktok":
      return { topPct: 10, bottomPct: 22, label: "TikTok safe" };
  }
}
