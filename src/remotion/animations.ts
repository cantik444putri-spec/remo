/**
 * Shared animation helpers. Most scenes import these so timings stay
 * consistent across the composition. Every helper is deterministic
 * (frame-pure) so Remotion can render server-side reproducibly.
 */

import { interpolate, spring } from "remotion";

/** Smooth easeOutExpo for entrances. */
export const easeOutExpo = (t: number): number =>
  t === 1 ? 1 : 1 - Math.pow(2, -10 * t);

/** Soft easeInOutCubic; great for text fades. */
export const easeInOutCubic = (t: number): number =>
  t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

/** Elastic overshoot, snappy feel at the end. */
export const easeOutBack = (t: number): number => {
  const c1 = 1.70158;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
};

/**
 * A cinematic spring tuned for typography and UI entrances.
 * Slightly underdamped so it has a hint of bounce without feeling jittery.
 */
export function cinematicSpring(opts: {
  frame: number;
  fps: number;
  from?: number;
  to?: number;
  delay?: number;
}): number {
  return spring({
    frame: Math.max(0, opts.frame - (opts.delay ?? 0)),
    fps: opts.fps,
    from: opts.from ?? 0,
    to: opts.to ?? 1,
    config: { damping: 16, mass: 0.6, stiffness: 110 },
  });
}

/**
 * Linear keyframe helper with clamped extrapolation. Shorthand so scene
 * code stays readable.
 */
export function kf(
  frame: number,
  times: number[],
  values: number[],
): number {
  return interpolate(frame, times, values, {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
}

/** Cubic bezier-like ease approximations for quick use with kf(). */
export const eases = {
  linear: (t: number) => t,
  easeOutExpo,
  easeInOutCubic,
  easeOutBack,
};
