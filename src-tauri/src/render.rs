// Render pipeline: spawn `npx remotion render` as a child process, pump
// its stdout for progress + log events, and emit them to the webview.
//
// Events (payload shapes in the TS wrapper):
//   render://progress { jobId, percent, framesRendered?, durationInFrames?, message? }
//   render://log      { jobId, line }
//   render://done     { jobId, outputPath, durationMs }
//   render://error    { jobId, message }
//
// The command surface mirrors what the frontend needs:
//   render_start(spec: RenderSpec) -> JobId
//   render_cancel(jobId)
//   render_list() -> Vec<JobInfo>
//   render_open_folder(jobId)
//
// Cancellation is cooperative: we keep the child's Kill handle in a
// global map and call it from render_cancel.

use std::{
    collections::HashMap,
    path::{Path, PathBuf},
    process::Stdio,
    sync::Arc,
    time::Instant,
};

use chrono::Local;
use serde::{Deserialize, Serialize};
use tauri::{AppHandle, Emitter, Manager};
use thiserror::Error;
use tokio::{
    io::{AsyncBufReadExt, BufReader},
    process::{Child, Command},
    sync::Mutex,
};
use uuid::Uuid;

/* -------------------------------------------------------------------------- */
/* Types                                                                       */
/* -------------------------------------------------------------------------- */

#[derive(Debug, Error, Serialize)]
pub enum RenderError {
    #[error("invalid argument: {0}")]
    InvalidArg(String),
    #[error("io error: {0}")]
    Io(String),
    #[error("render failed: {0}")]
    Failed(String),
    #[error("job not found: {0}")]
    NotFound(String),
}

impl From<std::io::Error> for RenderError {
    fn from(err: std::io::Error) -> Self {
        RenderError::Io(err.to_string())
    }
}

/// Spec coming from the renderer. Mirrors the TypeScript RenderPreset
/// shape plus the composition id + input props blob + project name.
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct RenderSpec {
    /// Human label used in the job list and folder name.
    pub project_name: String,
    /// Composition id registered in the Remotion Root (e.g. "Main").
    pub composition: String,
    /// Path relative to project root of the Remotion entry point.
    pub entry: String,
    pub width: u32,
    pub height: u32,
    pub fps: u32,
    /// "h264" | "h265" | "prores" | "vp9" | "gif" | "png-sequence".
    pub codec: String,
    /// Optional ProRes profile: "4444", "4444-xq", "hq", "standard", "light", "proxy".
    #[serde(default)]
    pub prores_profile: Option<String>,
    /// File extension without the dot, e.g. "mp4", "mov", "webm", "gif".
    pub extension: String,
    /// CRF for h264/h265/vp9; Remotion clamps valid range per codec.
    #[serde(default)]
    pub crf: Option<u8>,
    /// Extra JSON input props fed to the composition.
    #[serde(default)]
    pub input_props: Option<serde_json::Value>,
    /// Concurrency. None -> Remotion default.
    #[serde(default)]
    pub concurrency: Option<u32>,
    /// Remotion license key: "free-license" or a company key.
    pub license_key: String,
    /// Force the frames directory to stay transparent for alpha codecs.
    #[serde(default)]
    pub supports_alpha: bool,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub enum JobStatus {
    Queued,
    Running,
    Succeeded,
    Failed,
    Cancelled,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct JobInfo {
    pub id: String,
    pub project_name: String,
    pub preset_label: String,
    pub output_path: PathBuf,
    pub status: JobStatus,
    pub percent: f32,
    pub started_at_ms: i64,
    /// Populated when the job reaches Succeeded/Failed/Cancelled.
    pub finished_at_ms: Option<i64>,
    pub error_message: Option<String>,
}

struct JobRuntime {
    /// Kill handle so render_cancel can terminate the child.
    child: Option<Child>,
    info: JobInfo,
}

/// Shared state; mutex guards both the job map and the per-job stats.
pub struct RenderState {
    jobs: Mutex<HashMap<String, JobRuntime>>,
}

impl Default for RenderState {
    fn default() -> Self {
        Self { jobs: Mutex::new(HashMap::new()) }
    }
}

/* -------------------------------------------------------------------------- */
/* Progress parser                                                             */
/* -------------------------------------------------------------------------- */

/// Very small parser that extracts "XX%" or "X/Y frames" from a line of
/// Remotion CLI output. We intentionally keep it permissive because the
/// exact format changes across Remotion versions; anything we don't
/// understand just flows through as a log line.
fn parse_progress(line: &str) -> Option<(f32, Option<(u32, u32)>)> {
    // Try "Rendering | 45%" or similar.
    if let Some(pct_pos) = line.find('%') {
        let upto = &line[..pct_pos];
        let num_start = upto
            .rfind(|c: char| !c.is_ascii_digit() && c != '.')
            .map(|i| i + 1)
            .unwrap_or(0);
        if let Ok(pct) = upto[num_start..].trim().parse::<f32>() {
            if (0.0..=100.0).contains(&pct) {
                let frames = parse_frames(line);
                return Some((pct, frames));
            }
        }
    }
    None
}

/// Try to find "A / B" or "A/B" frames counts in a line.
fn parse_frames(line: &str) -> Option<(u32, u32)> {
    let mut parts = line.split_whitespace();
    while let Some(tok) = parts.next() {
        if let Some(slash) = tok.find('/') {
            let a = tok[..slash].trim_start_matches('(').parse::<u32>().ok();
            let b = tok[slash + 1..]
                .trim_end_matches(|c: char| !c.is_ascii_digit())
                .parse::<u32>()
                .ok();
            if let (Some(a), Some(b)) = (a, b) {
                if b > 0 && a <= b {
                    return Some((a, b));
                }
            }
        }
    }
    None
}

/* -------------------------------------------------------------------------- */
/* Path helpers                                                                */
/* -------------------------------------------------------------------------- */

fn sanitize_name(name: &str) -> String {
    name.chars()
        .map(|c| {
            if c.is_ascii_alphanumeric() || c == '-' || c == '_' || c == ' ' {
                c
            } else {
                '-'
            }
        })
        .collect::<String>()
        .split_whitespace()
        .collect::<Vec<_>>()
        .join("-")
}

fn default_output_root(app: &AppHandle) -> PathBuf {
    // Prefer the user's Documents folder so renders are easy to find.
    if let Ok(home) = app
        .path()
        .document_dir()
        .map(|p| p.join("Remotion Studio Tools Microstock").join("Renders"))
    {
        return home;
    }
    // Fallback to app data dir.
    app.path()
        .app_data_dir()
        .unwrap_or_else(|_| PathBuf::from("."))
        .join("Renders")
}

fn build_output_path(
    app: &AppHandle,
    project_name: &str,
    extension: &str,
    codec: &str,
) -> Result<PathBuf, RenderError> {
    let root = default_output_root(app);
    std::fs::create_dir_all(&root)?;
    let ts = Local::now().format("%Y%m%d-%H%M%S").to_string();
    let base = format!("{}-{}", sanitize_name(project_name), ts);
    let path = if codec == "png-sequence" {
        // PNG sequences need a folder; Remotion writes frame-XXXXXX.png inside.
        let folder = root.join(&base);
        std::fs::create_dir_all(&folder)?;
        folder
    } else {
        root.join(format!("{}.{}", base, extension))
    };
    Ok(path)
}

/* -------------------------------------------------------------------------- */
/* Child process construction                                                  */
/* -------------------------------------------------------------------------- */

/// Build the `npx remotion render ...` command. On Windows we spawn via
/// `cmd /C` so the .cmd shim for npx is picked up; on Unix we call `npx`
/// directly.
fn build_command(
    working_dir: &Path,
    spec: &RenderSpec,
    output_path: &Path,
    input_props_file: &Path,
) -> Command {
    let mut args: Vec<String> = vec![
        "remotion".to_string(),
        "render".to_string(),
        spec.entry.clone(),
        spec.composition.clone(),
        output_path.to_string_lossy().to_string(),
        format!("--codec={}", spec.codec),
        format!("--width={}", spec.width),
        format!("--height={}", spec.height),
        format!("--fps={}", spec.fps),
        format!("--props={}", input_props_file.to_string_lossy()),
        format!("--log=verbose"),
        format!("--license-key={}", spec.license_key),
    ];
    if let Some(profile) = &spec.prores_profile {
        args.push(format!("--prores-profile={}", profile));
    }
    if let Some(crf) = spec.crf {
        args.push(format!("--crf={}", crf));
    }
    if let Some(concurrency) = spec.concurrency {
        args.push(format!("--concurrency={}", concurrency));
    }
    if spec.supports_alpha {
        // Remotion's CLI honors --image-format=png for alpha masters
        // and falls back to default otherwise. ProRes/VP9 already carry
        // alpha via their containers so this is only useful for GIF /
        // PNG-sequence presets.
        if spec.codec == "png-sequence" {
            // Nothing to add; frame output is PNG by definition.
        }
    }

    #[cfg(target_os = "windows")]
    {
        let mut cmd = Command::new("cmd");
        cmd.arg("/C").arg("npx").args(&args);
        cmd.current_dir(working_dir);
        // Hide the shim's extra console window on Windows.
        use std::os::windows::process::CommandExt;
        const CREATE_NO_WINDOW: u32 = 0x0800_0000;
        cmd.creation_flags(CREATE_NO_WINDOW);
        cmd.stdout(Stdio::piped()).stderr(Stdio::piped());
        cmd
    }
    #[cfg(not(target_os = "windows"))]
    {
        let mut cmd = Command::new("npx");
        cmd.args(&args);
        cmd.current_dir(working_dir);
        cmd.stdout(Stdio::piped()).stderr(Stdio::piped());
        cmd
    }
}

/* -------------------------------------------------------------------------- */
/* Tauri commands                                                              */
/* -------------------------------------------------------------------------- */

#[tauri::command]
pub async fn render_start(
    app: AppHandle,
    spec: RenderSpec,
    preset_label: String,
    state: tauri::State<'_, Arc<RenderState>>,
) -> Result<JobInfo, RenderError> {
    if spec.project_name.trim().is_empty() {
        return Err(RenderError::InvalidArg("projectName required".into()));
    }
    if spec.composition.trim().is_empty() {
        return Err(RenderError::InvalidArg("composition required".into()));
    }
    if spec.license_key.trim().is_empty() {
        return Err(RenderError::InvalidArg("licenseKey required".into()));
    }

    let job_id = Uuid::new_v4().to_string();
    let output_path = build_output_path(
        &app,
        &spec.project_name,
        &spec.extension,
        &spec.codec,
    )?;

    // Write inputProps to a temp file so command-line length stays bounded.
    let props_file = {
        let dir = app.path().app_cache_dir().unwrap_or_else(|_| PathBuf::from("."));
        std::fs::create_dir_all(&dir)?;
        let p = dir.join(format!("rstm-props-{}.json", job_id));
        let body = spec
            .input_props
            .clone()
            .unwrap_or(serde_json::json!({}))
            .to_string();
        std::fs::write(&p, body)?;
        p
    };

    // The working directory is where package.json lives. Assume Tauri is
    // launched from the project root so CWD of the app is already that
    // directory. If the frontend is bundled, we'd need to pass this
    // explicitly from the UI — a follow-up for M10 packaging.
    let cwd = std::env::current_dir().unwrap_or_else(|_| PathBuf::from("."));
    let mut cmd = build_command(&cwd, &spec, &output_path, &props_file);

    let started = Instant::now();
    let mut child = cmd.spawn().map_err(|e| RenderError::Failed(e.to_string()))?;

    let stdout = child.stdout.take();
    let stderr = child.stderr.take();

    let info = JobInfo {
        id: job_id.clone(),
        project_name: spec.project_name.clone(),
        preset_label: preset_label.clone(),
        output_path: output_path.clone(),
        status: JobStatus::Running,
        percent: 0.0,
        started_at_ms: Local::now().timestamp_millis(),
        finished_at_ms: None,
        error_message: None,
    };

    {
        let mut jobs = state.jobs.lock().await;
        jobs.insert(
            job_id.clone(),
            JobRuntime {
                child: Some(child),
                info: info.clone(),
            },
        );
    }

    // Spawn pump tasks for stdout and stderr so the child isn't blocked
    // on its pipes. Both feed log events; stdout additionally parses
    // progress lines.
    let app_cl = app.clone();
    let job_id_cl = job_id.clone();
    let state_cl = state.inner().clone();
    tokio::spawn(async move {
        if let Some(stdout) = stdout {
            let mut reader = BufReader::new(stdout).lines();
            while let Ok(Some(line)) = reader.next_line().await {
                // Emit every line as a log event so the UI can tail.
                let _ = app_cl.emit(
                    "render://log",
                    LogPayload {
                        job_id: job_id_cl.clone(),
                        line: line.clone(),
                    },
                );
                if let Some((pct, frames)) = parse_progress(&line) {
                    {
                        let mut jobs = state_cl.jobs.lock().await;
                        if let Some(j) = jobs.get_mut(&job_id_cl) {
                            j.info.percent = pct;
                        }
                    }
                    let _ = app_cl.emit(
                        "render://progress",
                        ProgressPayload {
                            job_id: job_id_cl.clone(),
                            percent: pct,
                            frames_rendered: frames.map(|(a, _)| a),
                            duration_in_frames: frames.map(|(_, b)| b),
                            message: None,
                        },
                    );
                }
            }
        }
    });

    let app_cl = app.clone();
    let job_id_cl = job_id.clone();
    tokio::spawn(async move {
        if let Some(stderr) = stderr {
            let mut reader = BufReader::new(stderr).lines();
            while let Ok(Some(line)) = reader.next_line().await {
                let _ = app_cl.emit(
                    "render://log",
                    LogPayload {
                        job_id: job_id_cl.clone(),
                        line,
                    },
                );
            }
        }
    });

    // Task that awaits child exit and emits done/error + flips job status.
    let app_cl = app.clone();
    let job_id_cl = job_id.clone();
    let output_cl = output_path.clone();
    let state_cl2 = state.inner().clone();
    tokio::spawn(async move {
        // We need to take the child back out of the runtime to .wait() it.
        let child_opt = {
            let mut jobs = state_cl2.jobs.lock().await;
            jobs.get_mut(&job_id_cl).and_then(|j| j.child.take())
        };
        let Some(mut child) = child_opt else { return };
        let wait = child.wait().await;
        let duration_ms = started.elapsed().as_millis() as u64;

        let mut jobs = state_cl2.jobs.lock().await;
        let Some(job) = jobs.get_mut(&job_id_cl) else { return };

        match wait {
            Ok(status) if status.success() => {
                job.info.status = JobStatus::Succeeded;
                job.info.percent = 100.0;
                job.info.finished_at_ms = Some(Local::now().timestamp_millis());
                let _ = app_cl.emit(
                    "render://done",
                    DonePayload {
                        job_id: job_id_cl.clone(),
                        output_path: output_cl.clone(),
                        duration_ms,
                    },
                );
            }
            Ok(status) => {
                // Distinguish cancel (status already set) from real failure.
                if job.info.status != JobStatus::Cancelled {
                    job.info.status = JobStatus::Failed;
                    let msg = format!("exit status: {}", status);
                    job.info.error_message = Some(msg.clone());
                    job.info.finished_at_ms = Some(Local::now().timestamp_millis());
                    let _ = app_cl.emit(
                        "render://error",
                        ErrorPayload {
                            job_id: job_id_cl.clone(),
                            message: msg,
                        },
                    );
                } else {
                    job.info.finished_at_ms = Some(Local::now().timestamp_millis());
                    let _ = app_cl.emit(
                        "render://error",
                        ErrorPayload {
                            job_id: job_id_cl.clone(),
                            message: "cancelled".into(),
                        },
                    );
                }
            }
            Err(err) => {
                job.info.status = JobStatus::Failed;
                let msg = err.to_string();
                job.info.error_message = Some(msg.clone());
                job.info.finished_at_ms = Some(Local::now().timestamp_millis());
                let _ = app_cl.emit(
                    "render://error",
                    ErrorPayload {
                        job_id: job_id_cl.clone(),
                        message: msg,
                    },
                );
            }
        }

        // Clean up the props file on exit; keep the output file.
        let _ = std::fs::remove_file(&props_file);
    });

    Ok(info)
}

#[tauri::command]
pub async fn render_cancel(
    job_id: String,
    state: tauri::State<'_, Arc<RenderState>>,
) -> Result<(), RenderError> {
    let mut jobs = state.jobs.lock().await;
    let job = jobs
        .get_mut(&job_id)
        .ok_or_else(|| RenderError::NotFound(job_id.clone()))?;

    // Mark cancelled first so the exit-watcher classifies correctly.
    job.info.status = JobStatus::Cancelled;

    if let Some(child) = job.child.as_mut() {
        let _ = child.start_kill();
    }
    Ok(())
}

#[tauri::command]
pub async fn render_list(
    state: tauri::State<'_, Arc<RenderState>>,
) -> Result<Vec<JobInfo>, RenderError> {
    let jobs = state.jobs.lock().await;
    let mut out: Vec<JobInfo> = jobs.values().map(|j| j.info.clone()).collect();
    out.sort_by_key(|j| -j.started_at_ms);
    Ok(out)
}

#[tauri::command]
pub async fn render_open_folder(
    app: AppHandle,
    job_id: String,
    state: tauri::State<'_, Arc<RenderState>>,
) -> Result<(), RenderError> {
    let jobs = state.jobs.lock().await;
    let Some(job) = jobs.get(&job_id) else {
        return Err(RenderError::NotFound(job_id));
    };
    let target = if job.info.output_path.is_dir() {
        job.info.output_path.clone()
    } else {
        job.info
            .output_path
            .parent()
            .map(|p| p.to_path_buf())
            .unwrap_or_else(|| job.info.output_path.clone())
    };
    use tauri_plugin_opener::OpenerExt;
    app.opener()
        .open_path(target.to_string_lossy().to_string(), None::<&str>)
        .map_err(|e| RenderError::Io(e.to_string()))?;
    Ok(())
}

/* -------------------------------------------------------------------------- */
/* Event payloads                                                              */
/* -------------------------------------------------------------------------- */

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
struct ProgressPayload {
    job_id: String,
    percent: f32,
    frames_rendered: Option<u32>,
    duration_in_frames: Option<u32>,
    message: Option<String>,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
struct LogPayload {
    job_id: String,
    line: String,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
struct DonePayload {
    job_id: String,
    output_path: PathBuf,
    duration_ms: u64,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
struct ErrorPayload {
    job_id: String,
    message: String,
}

/* -------------------------------------------------------------------------- */
/* Registration                                                                */
/* -------------------------------------------------------------------------- */

pub fn init_state() -> Arc<RenderState> {
    Arc::new(RenderState::default())
}
