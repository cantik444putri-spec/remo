/**
 * AI storyboard pipeline.
 *
 * Flow:
 *   1. Build a strict system prompt that forces JSON output matching
 *      StoryboardSchema.
 *   2. Call the active provider in non-streaming JSON mode. We accumulate
 *      the stream (reusing chatService's provider instance) and parse the
 *      buffered text at the end.
 *   3. Zod-validate the payload; any validation failure surfaces a clear
 *      message so the user can tweak their prompt.
 *   4. Map the validated storyboard to MainCompositionProps at the target
 *      fps (seconds are converted to frames based on the active preset).
 */

import { z } from "zod";
import { createProvider, type ChatMessage } from "@/lib/providers";
import { getSecret } from "@/lib/keystore";
import { useProviderStore } from "@/stores/providers";
import { mainDefaults, type MainCompositionProps } from "@/remotion/Main";

/* -------------------------------------------------------------------------- */
/* Schema                                                                      */
/* -------------------------------------------------------------------------- */

export const StoryboardSchema = z.object({
  title: z.object({
    heading: z.string().min(1).max(120),
    subtitle: z.string().max(200).optional().nullable(),
  }),
  outro: z.object({
    heading: z.string().min(1).max(120),
    callToAction: z.string().min(1).max(80),
  }),
  lowerThird: z.object({
    name: z.string().min(1).max(80),
    tagline: z.string().max(120).optional().nullable(),
    position: z.enum(["left", "right"]).optional(),
  }),
  hud: z.object({
    enabled: z.boolean(),
    label: z.string().min(1).max(40),
    // Accept any valid CSS color; validated lightly by regex to catch
    // obvious trash and pass the rest through to the browser.
    accentColor: z
      .string()
      .regex(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$|^[a-z]+$/)
      .optional()
      .nullable(),
  }),
  particles: z.object({
    enabled: z.boolean(),
    // 40..600 matches the Inspector slider range.
    count: z.number().int().min(40).max(600).optional(),
  }),
  timing: z.object({
    titleDurationSeconds: z.number().min(0.5).max(20),
    outroDurationSeconds: z.number().min(0.5).max(20),
  }),
  backgroundColor: z
    .string()
    .regex(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/)
    .optional()
    .nullable(),
  transparentBackground: z.boolean().optional(),
  /** Free-form AI commentary shown beneath the storyboard preview. */
  notes: z.string().max(1200).optional().nullable(),
});

export type Storyboard = z.infer<typeof StoryboardSchema>;

/* -------------------------------------------------------------------------- */
/* Prompt builder                                                              */
/* -------------------------------------------------------------------------- */

/**
 * System prompt constraining the model to the schema. Written so smaller
 * models still produce valid JSON: every field is described, sensible
 * ranges are called out, and the examples avoid anything that could be
 * misread as the actual task.
 */
export function buildStoryboardSystemPrompt(opts: {
  presetLabel: string;
  fps: number;
  supportsAlpha: boolean;
}): string {
  return [
    "You are a storyboard generator for Remotion Studio Tools Microstock.",
    "Given a creator brief, return a single JSON object that follows this",
    "TypeScript type EXACTLY, with no markdown fences, comments, or prose",
    "outside the object. Keep wording concise and on-brand for microstock.",
    "",
    "type Storyboard = {",
    "  title: { heading: string; subtitle?: string };",
    "  outro: { heading: string; callToAction: string };",
    "  lowerThird: { name: string; tagline?: string; position?: 'left' | 'right' };",
    "  hud: { enabled: boolean; label: string; accentColor?: string };",
    "  particles: { enabled: boolean; count?: number };  // count in 40..600",
    "  timing: { titleDurationSeconds: number; outroDurationSeconds: number };",
    "  backgroundColor?: string;   // hex, e.g. #0a0a0f",
    "  transparentBackground?: boolean;",
    "  notes?: string;",
    "};",
    "",
    "Rules:",
    "- heading is large on-screen; keep it under 8 words.",
    "- subtitle is supporting copy; under 14 words.",
    "- hud.label is a short uppercase-able badge (e.g. 'LIVE · 4K', 'STUDIO').",
    "- Durations are in seconds (fractional ok). Keep total under 30s.",
    "- accentColor and backgroundColor must be valid hex like #a855f7.",
    `- Target preset: ${opts.presetLabel} (${opts.fps} fps). Alpha export: ${
      opts.supportsAlpha ? "ENABLED (prefer transparentBackground: true)" : "disabled"
    }.`,
    "- Return ONLY the JSON object. Do not wrap it in code fences.",
  ].join("\n");
}

/* -------------------------------------------------------------------------- */
/* Generation                                                                  */
/* -------------------------------------------------------------------------- */

export interface GenerateStoryboardOptions {
  /** User's natural language brief. */
  prompt: string;
  /** Optional preset context sent to the model. */
  presetLabel?: string;
  fps?: number;
  supportsAlpha?: boolean;
  /** AbortSignal to cancel mid-flight. */
  signal?: AbortSignal;
  /** Streaming callback with raw bytes as they arrive. */
  onToken?: (chunk: string) => void;
}

export class StoryboardGenerationError extends Error {
  constructor(message: string, public cause?: unknown) {
    super(message);
    this.name = "StoryboardGenerationError";
  }
}

/**
 * Generate a storyboard using the currently-active provider. Always returns
 * a validated Storyboard or throws StoryboardGenerationError with a
 * human-readable message suitable for a toast.
 */
export async function generateStoryboard(
  opts: GenerateStoryboardOptions,
): Promise<Storyboard> {
  const providerStore = useProviderStore.getState();
  const providerId = providerStore.activeProvider;
  const config = providerStore.configs[providerId];
  const model = providerStore.activeModel || config.defaultModel;

  if (!config.baseUrl) {
    throw new StoryboardGenerationError(
      `Provider "${config.label}" has no base URL. Configure it in Providers.`,
    );
  }
  const apiKey = await getSecret(config.apiKeyAlias);
  if (!apiKey) {
    throw new StoryboardGenerationError(
      `No API key saved for "${config.label}". Add one in Providers.`,
    );
  }

  const systemPrompt = buildStoryboardSystemPrompt({
    presetLabel: opts.presetLabel ?? "4K UHD · 60fps",
    fps: opts.fps ?? 60,
    supportsAlpha: opts.supportsAlpha ?? false,
  });

  const messages: ChatMessage[] = [
    { role: "system", content: systemPrompt },
    { role: "user", content: opts.prompt.trim() },
  ];

  // Nudge OpenAI-compatible providers into JSON mode. Mistral + OpenAI
  // both honor response_format; OpenRouter passes it through.
  const extra: Record<string, unknown> = {
    response_format: { type: "json_object" },
  };

  const provider = createProvider(config);
  const stream = provider.chatStream(apiKey, {
    model,
    messages,
    temperature: 0.4, // a little creativity, still obedient
    topP: 0.9,
    maxTokens: 1200,
    signal: opts.signal,
    extra,
  });

  let buffer = "";
  try {
    for await (const chunk of stream) {
      if (chunk.delta) {
        buffer += chunk.delta;
        opts.onToken?.(chunk.delta);
      }
    }
  } catch (err) {
    if (err instanceof Error && err.name === "AbortError") {
      throw new StoryboardGenerationError("Cancelled");
    }
    throw new StoryboardGenerationError(
      err instanceof Error ? err.message : "AI provider error",
      err,
    );
  }

  const parsed = safeExtractJson(buffer);
  if (!parsed) {
    throw new StoryboardGenerationError(
      "Could not parse the model's response as JSON. Try rewording your prompt or pick a larger model.",
    );
  }

  const result = StoryboardSchema.safeParse(parsed);
  if (!result.success) {
    const first = result.error.issues[0];
    const path = first?.path?.join(".") ?? "?";
    throw new StoryboardGenerationError(
      `Storyboard JSON failed validation at ${path}: ${first?.message ?? "invalid payload"}`,
    );
  }
  return result.data;
}

/**
 * Be lenient with models that occasionally wrap JSON in code fences or
 * trailing prose. Extract the first top-level {...} block and parse it.
 */
function safeExtractJson(raw: string): unknown | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;

  // Fast path
  try {
    return JSON.parse(trimmed);
  } catch {
    /* try to extract */
  }

  // Strip Markdown code fences if present.
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  if (fenced?.[1]) {
    try {
      return JSON.parse(fenced[1]);
    } catch {
      /* fall through */
    }
  }

  // Fallback: grab the widest {...} substring.
  const first = trimmed.indexOf("{");
  const last = trimmed.lastIndexOf("}");
  if (first !== -1 && last > first) {
    const slice = trimmed.slice(first, last + 1);
    try {
      return JSON.parse(slice);
    } catch {
      return null;
    }
  }
  return null;
}

/* -------------------------------------------------------------------------- */
/* Mapping                                                                     */
/* -------------------------------------------------------------------------- */

/**
 * Project a validated storyboard onto MainCompositionProps, converting
 * seconds to frames at the given fps and filling gaps from mainDefaults.
 * Keeps the existing composition's unrelated fields intact (e.g. preset
 * choice is owned by the store, not by the storyboard).
 */
export function storyboardToComposition(
  storyboard: Storyboard,
  fps: number,
  existing: MainCompositionProps,
): MainCompositionProps {
  const secToFrames = (sec: number) => Math.max(30, Math.round(sec * fps));

  return {
    ...existing,
    backgroundColor:
      storyboard.backgroundColor ?? existing.backgroundColor ?? mainDefaults.backgroundColor,
    transparentBackground:
      storyboard.transparentBackground ?? existing.transparentBackground,
    showParticles: storyboard.particles.enabled,
    showHud: storyboard.hud.enabled,
    titleDuration: secToFrames(storyboard.timing.titleDurationSeconds),
    outroDuration: secToFrames(storyboard.timing.outroDurationSeconds),
    transitionDuration: existing.transitionDuration,
    title: {
      title: storyboard.title.heading,
      subtitle: storyboard.title.subtitle ?? undefined,
      transparentBackground:
        storyboard.transparentBackground ?? existing.title.transparentBackground,
    },
    lowerThird: {
      name: storyboard.lowerThird.name,
      tagline: storyboard.lowerThird.tagline ?? undefined,
      position: storyboard.lowerThird.position ?? existing.lowerThird.position ?? "left",
    },
    outro: {
      heading: storyboard.outro.heading,
      callToAction: storyboard.outro.callToAction,
      transparentBackground:
        storyboard.transparentBackground ?? existing.outro.transparentBackground,
    },
    hud: {
      label: storyboard.hud.label,
      accentColor: storyboard.hud.accentColor ?? existing.hud.accentColor,
    },
    particles: {
      ...existing.particles,
      count: storyboard.particles.count ?? existing.particles.count,
    },
  };
}
