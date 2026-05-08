import { create } from "zustand";

/**
 * Local mirror of Rust-side JobInfo. Matches the shape emitted by
 * `render_list` and the progress/done/error events.
 */
export type JobStatus =
  | "queued"
  | "running"
  | "succeeded"
  | "failed"
  | "cancelled";

export interface RenderJob {
  id: string;
  projectName: string;
  presetLabel: string;
  outputPath: string;
  status: JobStatus;
  percent: number;
  startedAtMs: number;
  finishedAtMs?: number | null;
  errorMessage?: string | null;
  /** Tail of the process log; bounded to last N lines. */
  logTail: string[];
  framesRendered?: number;
  durationInFrames?: number;
}

const LOG_TAIL_LIMIT = 200;

export interface RendersState {
  jobs: Record<string, RenderJob>;
  order: string[];
  addJob: (job: RenderJob) => void;
  updateJob: (id: string, patch: Partial<RenderJob>) => void;
  appendLog: (id: string, line: string) => void;
  removeJob: (id: string) => void;
  clearFinished: () => void;
}

export const useRendersStore = create<RendersState>((set) => ({
  jobs: {},
  order: [],

  addJob: (job) =>
    set((s) => {
      if (s.jobs[job.id]) {
        return s;
      }
      return {
        jobs: { ...s.jobs, [job.id]: job },
        order: [job.id, ...s.order.filter((id) => id !== job.id)],
      };
    }),

  updateJob: (id, patch) =>
    set((s) => {
      const existing = s.jobs[id];
      if (!existing) return s;
      return { jobs: { ...s.jobs, [id]: { ...existing, ...patch } } };
    }),

  appendLog: (id, line) =>
    set((s) => {
      const existing = s.jobs[id];
      if (!existing) return s;
      const next = [...existing.logTail, line];
      if (next.length > LOG_TAIL_LIMIT) {
        next.splice(0, next.length - LOG_TAIL_LIMIT);
      }
      return { jobs: { ...s.jobs, [id]: { ...existing, logTail: next } } };
    }),

  removeJob: (id) =>
    set((s) => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { [id]: _, ...rest } = s.jobs;
      return { jobs: rest, order: s.order.filter((x) => x !== id) };
    }),

  clearFinished: () =>
    set((s) => {
      const remaining: Record<string, RenderJob> = {};
      const remainingOrder: string[] = [];
      for (const id of s.order) {
        const job = s.jobs[id];
        if (!job) continue;
        if (job.status === "running" || job.status === "queued") {
          remaining[id] = job;
          remainingOrder.push(id);
        }
      }
      return { jobs: remaining, order: remainingOrder };
    }),
}));
