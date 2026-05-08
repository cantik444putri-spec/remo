import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import {
  CheckCircle2,
  CircleAlert,
  CircleX,
  FolderOpen,
  Loader2,
  Square,
  Terminal,
  Trash2,
} from "lucide-react";
import { PageShell } from "./_PageShell";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useRendersStore, type JobStatus, type RenderJob } from "@/stores/renders";
import {
  cancelRender,
  ensureRenderSubscriptions,
  openRenderFolder,
  refreshRenderList,
} from "@/lib/renderService";

export function RendersPage() {
  const order = useRendersStore((s) => s.order);
  const jobs = useRendersStore((s) => s.jobs);
  const clearFinished = useRendersStore((s) => s.clearFinished);

  useEffect(() => {
    // Page may be visited before App.tsx's boot effect has run (SSR or HMR).
    void ensureRenderSubscriptions();
    void refreshRenderList();
  }, []);

  const list = useMemo(() => order.map((id) => jobs[id]).filter(Boolean), [
    order,
    jobs,
  ]);

  const anyFinished = list.some(
    (j) =>
      j.status === "succeeded" ||
      j.status === "failed" ||
      j.status === "cancelled",
  );

  return (
    <PageShell
      title="Renders"
      description="Antrian render Remotion dengan progress dan ETA real-time."
      badge="M8 · live"
    >
      <div className="mb-4 flex items-center justify-end gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={clearFinished}
          disabled={!anyFinished}
        >
          <Trash2 className="size-3.5" />
          Clear finished
        </Button>
      </div>

      {list.length === 0 ? (
        <EmptyQueue />
      ) : (
        <ul className="flex flex-col gap-3">
          <AnimatePresence initial={false}>
            {list.map((job) => (
              <motion.li
                key={job.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.18 }}
              >
                <JobCard job={job} />
              </motion.li>
            ))}
          </AnimatePresence>
        </ul>
      )}
    </PageShell>
  );
}

/* -------------------------------------------------------------------------- */
/* Components                                                                  */
/* -------------------------------------------------------------------------- */

function EmptyQueue() {
  return (
    <div className="glass flex flex-col items-center justify-center gap-2 rounded-[var(--radius-lg)] p-10 text-center">
      <div className="grid size-10 place-items-center rounded-full gradient-accent shadow-[var(--shadow-glow)]">
        <FolderOpen className="size-4 text-white" />
      </div>
      <h3 className="text-sm font-semibold">Queue is empty</h3>
      <p className="max-w-sm text-xs text-[var(--color-muted)]">
        Head to Studio and click Render. Output files land in{" "}
        <span className="font-mono">
          Documents / Remotion Studio Tools Microstock / Renders
        </span>
        .
      </p>
    </div>
  );
}

function JobCard({ job }: { job: RenderJob }) {
  const [logOpen, setLogOpen] = useState(false);
  const active = job.status === "running" || job.status === "queued";
  const durationSec =
    job.finishedAtMs && job.startedAtMs
      ? Math.max(0, (job.finishedAtMs - job.startedAtMs) / 1000)
      : null;

  const pct = Math.max(0, Math.min(100, job.percent || 0));

  const onCancel = async () => {
    try {
      await cancelRender(job.id);
      toast("Cancel requested", { description: job.projectName });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Cancel failed";
      toast.error("Cancel failed", { description: msg });
    }
  };

  const onOpen = async () => {
    await openRenderFolder(job.id);
  };

  return (
    <div
      className={cn(
        "glass rounded-[var(--radius-lg)] p-4",
        job.status === "failed" && "border-red-500/40",
        job.status === "succeeded" && "border-emerald-500/30",
      )}
    >
      <div className="flex items-center gap-3">
        <StatusIcon status={job.status} />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <div className="truncate text-sm font-semibold">
              {job.projectName}
            </div>
            <span className="rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] px-2 py-0.5 font-mono text-[10px] text-[var(--color-muted)]">
              {job.presetLabel}
            </span>
          </div>
          <div className="mt-0.5 flex items-center gap-2 text-[11px] text-[var(--color-muted)]">
            <StatusLabel status={job.status} />
            {job.framesRendered !== undefined &&
              job.durationInFrames !== undefined && (
                <span className="font-mono">
                  {job.framesRendered}/{job.durationInFrames}f
                </span>
              )}
            {durationSec !== null && (
              <span className="font-mono">{durationSec.toFixed(1)}s</span>
            )}
            {job.errorMessage && (
              <span className="truncate text-red-400">{job.errorMessage}</span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1">
          {active ? (
            <Button
              size="sm"
              variant="destructive"
              onClick={onCancel}
              title="Cancel"
            >
              <Square className="size-3.5 fill-current" />
              Cancel
            </Button>
          ) : (
            <Button
              size="sm"
              variant="secondary"
              onClick={onOpen}
              disabled={!job.outputPath}
            >
              <FolderOpen className="size-3.5" />
              Open
            </Button>
          )}
          <Button
            size="icon"
            variant="ghost"
            onClick={() => setLogOpen((v) => !v)}
            title={logOpen ? "Hide log" : "Show log"}
            aria-pressed={logOpen}
            className="size-8"
          >
            <Terminal className="size-4" />
          </Button>
        </div>
      </div>

      {/* Progress bar */}
      <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full border border-[var(--color-border)] bg-[var(--color-surface)]">
        <motion.div
          className={cn(
            "h-full rounded-full",
            job.status === "failed"
              ? "bg-red-500"
              : job.status === "cancelled"
                ? "bg-zinc-500"
                : job.status === "succeeded"
                  ? "bg-emerald-400"
                  : "gradient-accent",
          )}
          initial={false}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.25, ease: "easeOut" }}
        />
      </div>

      {/* Output path */}
      {job.outputPath && (
        <div className="mt-2 truncate font-mono text-[10px] text-[var(--color-muted)]">
          {job.outputPath}
        </div>
      )}

      {/* Log tail */}
      <AnimatePresence initial={false}>
        {logOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="overflow-hidden"
          >
            <pre className="mt-3 max-h-56 overflow-auto rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-bg)]/60 p-2 font-mono text-[10px] leading-[1.45] text-[var(--color-muted)]">
              {job.logTail.length === 0
                ? "(waiting for output…)"
                : job.logTail.join("\n")}
            </pre>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function StatusIcon({ status }: { status: JobStatus }) {
  switch (status) {
    case "running":
    case "queued":
      return <Loader2 className="size-4 shrink-0 animate-spin text-[var(--color-accent)]" />;
    case "succeeded":
      return <CheckCircle2 className="size-4 shrink-0 text-emerald-400" />;
    case "failed":
      return <CircleAlert className="size-4 shrink-0 text-red-400" />;
    case "cancelled":
      return <CircleX className="size-4 shrink-0 text-zinc-400" />;
  }
}

function StatusLabel({ status }: { status: JobStatus }) {
  const label =
    status === "succeeded"
      ? "done"
      : status === "failed"
        ? "failed"
        : status === "cancelled"
          ? "cancelled"
          : status === "running"
            ? "rendering"
            : "queued";
  return (
    <span className="uppercase tracking-wider">{label}</span>
  );
}
