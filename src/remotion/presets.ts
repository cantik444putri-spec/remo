/**
 * Render presets surfaced in the Studio render panel. The preset is the
 * single source of truth for the output filename extension, ffmpeg codec
 * flags, and alpha channel behaviour. The Rust render pipeline (M8)
 * consumes these via a Tauri command.
 */

export type Codec =
  | "h264"       // .mp4, standard, NVENC/QSV/AMF accelerated when possible
  | "h265"       // .mp4, higher compression
  | "prores"     // .mov, ProRes — proresProfile decides 4444 (alpha) vs 422
  | "vp9"        // .webm, supports alpha
  | "gif"        // animated GIF
  | "png-sequence"; // folder of .png with alpha

export type AspectPreset =
  | "uhd-16x9"
  | "hd-16x9"
  | "square-1x1"
  | "vertical-9x16"
  | "story-4x5";

export interface RenderPreset {
  id: string;
  label: string;
  description: string;
  width: number;
  height: number;
  fps: number;
  codec: Codec;
  /** Remotion's proresProfile: "4444" enables alpha; "4444-xq" is highest quality. */
  proresProfile?: "4444" | "4444-xq" | "hq" | "standard" | "light" | "proxy";
  /** Whether the encoded container supports an alpha channel. */
  supportsAlpha: boolean;
  /** File extension without the dot. */
  extension: "mp4" | "mov" | "webm" | "gif";
  /** CRF for h264/h265/vp9. Lower = higher quality; 18 is visually lossless. */
  crf?: number;
  /** Flag whether this preset is the suggested default in the UI. */
  recommended?: boolean;
}

export const RENDER_PRESETS: RenderPreset[] = [
  {
    id: "uhd-30-h264",
    label: "4K UHD · 30fps · H.264",
    description: "Default. MP4, broadly compatible, small file size.",
    width: 3840,
    height: 2160,
    fps: 30,
    codec: "h264",
    extension: "mp4",
    supportsAlpha: false,
    crf: 18,
    recommended: true,
  },
  {
    id: "uhd-30-prores4444",
    label: "4K UHD · 30fps · ProRes 4444 .mov (alpha)",
    description:
      "Transparent-background master. ProRes 4444 in a QuickTime container with alpha.",
    width: 3840,
    height: 2160,
    fps: 30,
    codec: "prores",
    proresProfile: "4444",
    extension: "mov",
    supportsAlpha: true,
  },
  {
    id: "uhd-60-h264",
    label: "4K UHD · 60fps · H.264",
    description: "Same 4K canvas, smoother motion.",
    width: 3840,
    height: 2160,
    fps: 60,
    codec: "h264",
    extension: "mp4",
    supportsAlpha: false,
    crf: 18,
  },
  {
    id: "fhd-30-h264",
    label: "1080p · 30fps · H.264",
    description: "Fast draft / streaming-friendly.",
    width: 1920,
    height: 1080,
    fps: 30,
    codec: "h264",
    extension: "mp4",
    supportsAlpha: false,
    crf: 20,
  },
  {
    id: "fhd-60-h264",
    label: "1080p · 60fps · H.264",
    description: "High-frame-rate Full HD.",
    width: 1920,
    height: 1080,
    fps: 60,
    codec: "h264",
    extension: "mp4",
    supportsAlpha: false,
    crf: 20,
  },
  {
    id: "square-1080-h264",
    label: "Square 1080 · 30fps",
    description: "Instagram feed / LinkedIn.",
    width: 1080,
    height: 1080,
    fps: 30,
    codec: "h264",
    extension: "mp4",
    supportsAlpha: false,
    crf: 20,
  },
  {
    id: "vertical-2160-h264",
    label: "Vertical 9:16 · 4K · 30fps",
    description: "TikTok / Reels / Shorts at 4K.",
    width: 2160,
    height: 3840,
    fps: 30,
    codec: "h264",
    extension: "mp4",
    supportsAlpha: false,
    crf: 18,
  },
  {
    id: "webm-alpha",
    label: "WebM VP9 · 30fps (alpha)",
    description: "Web-ready transparent video (Chrome, Safari 16+).",
    width: 1920,
    height: 1080,
    fps: 30,
    codec: "vp9",
    extension: "webm",
    supportsAlpha: true,
  },
];

export const DEFAULT_PRESET_ID = "uhd-30-h264";

export function getPreset(id: string): RenderPreset {
  return (
    RENDER_PRESETS.find((p) => p.id === id) ??
    RENDER_PRESETS.find((p) => p.id === DEFAULT_PRESET_ID)!
  );
}
