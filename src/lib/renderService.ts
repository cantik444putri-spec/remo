/**
 * Frontend wrapper over the Rust render commands. Encapsulates:
 *   - render_start / render_cancel / render_list / render_open_folder
 *   - subscribes to render://progress | log | done | error events once
 *     on module import, updating the renders store
 */

import { invoke } from "@tauri-apps/api/core";
import { listen, type UnlistenFn } from "@tauri-apps/api/event";
import { toast } from "sonner";
import { useRendersStore, type JobStatus, type RenderJob } from "@/stores/renders";
import { useStudioStore } from "@/stores/studio";
import { useSettingsStore } from "@/stores/settings";
import { getPreset, type RenderPreset } from "@/remotion/presets";
import type { MainCompositionProps } from "@/remotion/Main";

/* -------------------------------------------------------------------------- */
/* Types matching the Rust side                                                */
/* -------------------------------------------------------------------------- */

interface RenderSpec {
  projectName: string;
  composition: string;
  entry: string;
  width: number;
  height: number;
  fps: number;
  codec: string;
  proresProfile?: string;
  extension: string;
  crf?: number;
  inputProps?: unknown;
  concurrency?: number;
  licenseKey: string;
  supportsAlpha: boolean;
}

interface JobInfo {
  id: string;
  projectName: string;
  presetLabel: string;
  outputPath: string;
  status: JobStatus;
  percent: number;
  startedAtMs: number;
  finishedAtMs?: number | null;
  errorMessage?: string | null;
}

interface ProgressPayload {
  jobId: string;
  percent: number;
  framesRendered?: number;
  durationInFrames?: number;
  message?: string;
}

interface LogPayload {
  jobId: string;
  line: string;
}

interface DonePayload {
  jobId: string;
  outputPath: string;
  durationMs: number;
}

interface ErrorPayload {
  jobId: string;
  message: string;
}

function isTauri(): boolean {
  return (
    typeof window !== "undefined" &&
    "__TAURI_INTERNALS__" in window &&
    !!(window as unknown as { __TAURI_INTERNALS__: unknown })
      .__TAURI_INTERNALS__
  );
}

/* -------------------------------------------------------------------------- */
/* Event subscriptions                                                         */
/* -------------------------------------------------------------------------- */

let subscriptionsStarted = false;
const unlisteners: UnlistenFn[] = [];

/**
 * Begin listening for Rust render events. Idempotent — call freely.
 */
export async function ensureRenderSubscriptions(): Promise<void> {
  if (subscriptionsStarted || !isTauri()) return;
  subscriptionsStarted = true;

  try {
    unlisteners.push(
      await listen<ProgressPayload>("render://progress", (e) => {
        useRendersStore.getState().updateJob(e.payload.jobId, {
          percent: e.payload.percent,
          framesRendered: e.payload.framesRendered,
          durationInFrames: e.payload.durationInFrames,
        });
      }),
      await listen<LogPayload>("render://log", (e) => {
        useRendersStore.getState().appendLog(e.payload.jobId, e.payload.line);
      }),
      await listen<DonePayload>("render://done", (e) => {
        useRendersStore.getState().updateJob(e.payload.jobId, {
          status: "succeeded",
          percent: 100,
          outputPath: e.payload.outputPath,
          finishedAtMs: Date.now(),
        });
        toast.success("Render complete", {
          description: e.payload.outputPath,
          action: {
            label: "Open",
            onClick: () => {
              void openRenderFolder(e.payload.jobId);
            },
          },
        });
      }),
      await listen<ErrorPayload>("render://error", (e) => {
        const current = useRendersStore.getState().jobs[e.payload.jobId];
        const status: JobStatus =
          current?.status === "cancelled" ? "cancelled" : "failed";
        useRendersStore.getState().updateJob(e.payload.jobId, {
          status,
          errorMessage: e.payload.message,
          finishedAtMs: Date.now(),
        });
        if (status === "failed") {
          toast.error("Render failed", { description: e.payload.message });
        } else {
          toast("Render cancelled");
        }
      }),
    );
  } catch (err) {
    subscriptionsStarted = false;
    // eslint-disable-next-line no-console
    console.warn("[renderService] failed to subscribe to Tauri events", err);
  }
}

/* -------------------------------------------------------------------------- */
/* Hydration                                                                   */
/* -------------------------------------------------------------------------- */

/**
 * Pull the current job list from Rust on startup so renders survive an
 * app reload (within the same process lifetime).
 */
export async function refreshRenderList(): Promise<void> {
  if (!isTauri()) return;
  try {
    const list = await invoke<JobInfo[]>("render_list");
    const store = useRendersStore.getState();
    for (const info of list) {
      const existing = store.jobs[info.id];
      const job: RenderJob = {
        id: info.id,
        projectName: info.projectName,
        presetLabel: info.presetLabel,
        outputPath: info.outputPath,
        status: info.status,
        percent: info.percent,
        startedAtMs: info.startedAtMs,
        finishedAtMs: info.finishedAtMs ?? null,
        errorMessage: info.errorMessage ?? null,
        logTail: existing?.logTail ?? [],
      };
      store.addJob(job);
      store.updateJob(job.id, job);
    }
  } catch (err) {
    // eslint-disable-next-line no-console
    console.warn("[renderService] render_list failed", err);
  }
}

/* -------------------------------------------------------------------------- */
/* Public actions                                                              */
/* -------------------------------------------------------------------------- */

export interface StartRenderOptions {
  projectName: string;
  composition?: MainCompositionProps;
  entry?: string;
  compositionId?: string;
  concurrency?: number;
}

function resolveLicenseKey(): string {
  const s = useSettingsStore.getState();
  if (s.remotionCompanyLicenseKey) return s.remotionCompanyLicenseKey;
  if (s.remotionEligibleFree) return "free-license";
  throw new Error(
    "Remotion license unset. Enable Free eligibility or paste a Company License Key in Settings.",
  );
}

export async function startRender(
  opts: StartRenderOptions,
): Promise<string> {
  if (!isTauri()) {
    throw new Error(
      "Render requires the desktop app. Run `npm run tauri:dev` or build the installer.",
    );
  }
  await ensureRenderSubscriptions();

  const studio = useStudioStore.getState();
  const preset: RenderPreset = getPreset(studio.presetId);
  const composition = opts.composition ?? studio.composition;

  const spec: RenderSpec = {
    projectName: opts.projectName,
    composition: opts.compositionId ?? "Main",
    entry: opts.entry ?? "src/remotion/index.ts",
    width: preset.width,
    height: preset.height,
    fps: preset.fps,
    codec: preset.codec,
    proresProfile: preset.proresProfile,
    extension: preset.extension,
    crf: preset.crf,
    inputProps: composition,
    concurrency: opts.concurrency,
    licenseKey: resolveLicenseKey(),
    supportsAlpha: preset.supportsAlpha,
  };

  const info = await invoke<JobInfo>("render_start", {
    spec,
    presetLabel: preset.label,
  });

  useRendersStore.getState().addJob({
    id: info.id,
    projectName: info.projectName,
    presetLabel: info.presetLabel,
    outputPath: info.outputPath,
    status: info.status,
    percent: info.percent,
    startedAtMs: info.startedAtMs,
    finishedAtMs: info.finishedAtMs ?? null,
    errorMessage: info.errorMessage ?? null,
    logTail: [],
  });

  return info.id;
}

export async function cancelRender(jobId: string): Promise<void> {
  if (!isTauri()) return;
  await invoke("render_cancel", { jobId });
  useRendersStore.getState().updateJob(jobId, { status: "cancelled" });
}

export async function openRenderFolder(jobId: string): Promise<void> {
  if (!isTauri()) return;
  try {
    await invoke("render_open_folder", { jobId });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    toast.error("Could not open folder", { description: msg });
  }
}
