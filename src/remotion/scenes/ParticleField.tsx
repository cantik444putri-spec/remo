import { useEffect, useMemo, useRef } from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig, random } from "remotion";
import { createNoise2D } from "simplex-noise";
import { theme } from "../theme";
import { kf } from "../animations";

export interface ParticleFieldProps {
  count?: number;
  accentA?: string;
  accentB?: string;
  transparentBackground?: boolean;
}

export const particleFieldDefaults: ParticleFieldProps = {
  count: 180,
  accentA: undefined,
  accentB: undefined,
  transparentBackground: false,
};

interface Particle {
  ox: number;
  oy: number;
  r: number;
  hue: number;
  speed: number;
}

/**
 * Frame-deterministic particle flow field. Positions are re-computed on
 * every frame from a simplex-noise field so the field drifts smoothly
 * without any stateful animation loop. This keeps the renderer exact.
 */
export const ParticleField: React.FC<ParticleFieldProps> = ({
  count = 180,
  accentA,
  accentB,
  transparentBackground,
}) => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const colorA = accentA ?? theme.accent;
  const colorB = accentB ?? theme.accent2;

  // Seed particle start positions deterministically from Remotion's random.
  const particles = useMemo<Particle[]>(() => {
    const out: Particle[] = [];
    for (let i = 0; i < count; i += 1) {
      out.push({
        ox: random(`p-x-${i}`) * width,
        oy: random(`p-y-${i}`) * height,
        r: 1 + random(`p-r-${i}`) * 3,
        hue: random(`p-h-${i}`),
        speed: 0.3 + random(`p-s-${i}`) * 0.7,
      });
    }
    return out;
  }, [count, width, height]);

  // Noise field (reused across frames for cheaper computation).
  const noiseRef = useRef<ReturnType<typeof createNoise2D> | null>(null);
  if (!noiseRef.current) {
    // Seed is arbitrary; the field is large enough that drifting through
    // it looks organic.
    noiseRef.current = createNoise2D(() => 0.42);
  }

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, width, height);
    if (!transparentBackground) {
      ctx.fillStyle = theme.bg;
      ctx.fillRect(0, 0, width, height);
    }

    const noise = noiseRef.current!;
    const t = frame / 120;
    const fadeIn = kf(frame, [0, 20], [0, 1]);

    for (const p of particles) {
      const nx = noise(p.ox / 320 + t, p.oy / 320);
      const ny = noise(p.ox / 320, p.oy / 320 + t);
      const vx = nx * 160 * p.speed;
      const vy = ny * 160 * p.speed;
      const x = (p.ox + vx + width) % width;
      const y = (p.oy + vy + height) % height;

      const color = p.hue > 0.5 ? colorA : colorB;
      ctx.globalAlpha = (0.25 + p.hue * 0.45) * fadeIn;
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(x, y, p.r * 2.5, 0, Math.PI * 2);
      ctx.fill();

      // Core dot for sharper look.
      ctx.globalAlpha = fadeIn;
      ctx.fillStyle = "white";
      ctx.beginPath();
      ctx.arc(x, y, p.r * 0.5, 0, Math.PI * 2);
      ctx.fill();
    }
  }, [frame, width, height, particles, colorA, colorB, transparentBackground]);

  return (
    <AbsoluteFill
      style={{
        background: transparentBackground ? "transparent" : theme.bg,
      }}
    >
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        style={{
          width: "100%",
          height: "100%",
          filter: "blur(0.5px)",
        }}
      />
    </AbsoluteFill>
  );
};
