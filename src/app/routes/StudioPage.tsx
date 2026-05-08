import { motion } from "framer-motion";
import { PlayerShell } from "@/components/studio/PlayerShell";
import { Inspector } from "@/components/studio/Inspector";
import { RenderPanel } from "@/components/studio/RenderPanel";
import { StoryboardPanel } from "@/components/studio/StoryboardPanel";

/**
 * 3-panel Studio layout with an overlay AI storyboard panel:
 *
 *   [ RenderPanel 260 ] [ Player canvas (flex) ] [ Inspector 320 ]
 *                                                 [ StoryboardPanel 360 ]  (overlay, right)
 */
export function StudioPage() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="relative flex h-full min-h-0"
    >
      <RenderPanel />
      <section className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-[var(--color-border)] bg-[var(--color-bg)]/50 px-4 py-2 backdrop-blur-xl">
          <div className="text-xs font-medium">
            <span className="gradient-text">Studio</span>
            <span className="ml-2 text-[var(--color-muted)]">
              Live preview · Remotion Player
            </span>
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] px-2 py-0.5 text-[10px] font-medium text-[var(--color-muted)]">
            <span className="size-1.5 rounded-full bg-[var(--color-accent)] shadow-[0_0_6px_var(--color-accent)]" />
            M7 · AI storyboard
          </span>
        </header>
        <div className="min-h-0 flex-1 p-4">
          <div className="h-full w-full overflow-hidden rounded-[var(--radius-lg)] border border-[var(--color-border)] shadow-[var(--shadow-glow)]">
            <PlayerShell />
          </div>
        </div>
      </section>
      <Inspector />
      <StoryboardPanel />
    </motion.div>
  );
}
