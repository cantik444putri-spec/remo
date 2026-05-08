import { Minus, Square, X, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * Frameless custom title bar for Windows. Drag region is marked via
 * `data-tauri-drag-region`. Window control buttons call Tauri window APIs
 * (wired up in a later milestone).
 */
export function TitleBar() {
  const handle = async (
    action: "minimize" | "toggleMaximize" | "close",
  ) => {
    try {
      const { getCurrentWindow } = await import(
        "@tauri-apps/api/window"
      );
      const win = getCurrentWindow();
      if (action === "minimize") await win.minimize();
      if (action === "toggleMaximize") await win.toggleMaximize();
      if (action === "close") await win.close();
    } catch {
      // running in plain browser (e.g. `vite dev` without tauri) — no-op
    }
  };

  return (
    <header
      data-tauri-drag-region
      className="relative z-50 flex h-10 shrink-0 items-center justify-between border-b border-[var(--color-border)] bg-[var(--color-bg)]/80 pl-4 backdrop-blur-xl"
    >
      <div
        data-tauri-drag-region
        className="flex items-center gap-2 text-sm"
      >
        <span className="grid size-5 place-items-center rounded-md gradient-accent shadow-[var(--shadow-glow)]">
          <Sparkles className="size-3 text-white" strokeWidth={2.5} />
        </span>
        <span className="font-medium tracking-tight">
          Remotion Studio Tools{" "}
          <span className="gradient-text font-semibold">Microstock</span>
        </span>
      </div>
      <div className="flex items-center">
        <Button
          variant="ghost"
          size="icon"
          className="h-10 w-11 rounded-none hover:bg-white/5"
          aria-label="Minimize"
          onClick={() => handle("minimize")}
        >
          <Minus className="size-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-10 w-11 rounded-none hover:bg-white/5"
          aria-label="Maximize"
          onClick={() => handle("toggleMaximize")}
        >
          <Square className="size-3.5" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-10 w-11 rounded-none hover:bg-red-500/80 hover:text-white"
          aria-label="Close"
          onClick={() => handle("close")}
        >
          <X className="size-4" />
        </Button>
      </div>
    </header>
  );
}
