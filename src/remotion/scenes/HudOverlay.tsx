import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { Circle } from "@remotion/shapes";
import { evolvePath, getLength } from "@remotion/paths";
import { theme } from "../theme";
import { kf } from "../animations";

export interface HudOverlayProps {
  label: string;
  accentColor?: string;
  reveal?: number; // 0..1 fallback if not animated; overridden by frame
}

export const hudOverlayDefaults: HudOverlayProps = {
  label: "LIVE · 4K 60fps",
  accentColor: undefined,
};

/**
 * Broadcast / sci-fi HUD overlay suitable for compositing over footage.
 * Made from SVG paths that draw-on over time using @remotion/paths, plus
 * a radar ring built on @remotion/shapes Circle. Everything is frame-pure
 * so the renderer is deterministic.
 */
export const HudOverlay: React.FC<HudOverlayProps> = ({ label, accentColor }) => {
  const frame = useCurrentFrame();
  const { width, height, durationInFrames } = useVideoConfig();
  const accent = accentColor ?? theme.accent;

  // Corner L-brackets evolve in from 0 -> 1 in the first 20 frames.
  const progress = kf(frame, [0, 20], [0, 1]);
  const exit = kf(
    frame,
    [durationInFrames - 15, durationInFrames],
    [1, 0],
  );
  const alpha = Math.min(progress, exit);

  // Radar sweep rotates once per 90 frames.
  const sweepAngle = (frame * 4) % 360;

  const corner = width * 0.06;
  const inset = width * 0.04;

  // Path for one corner bracket (top-left). We reflect via CSS transform.
  const bracket = `M 0 ${corner} L 0 0 L ${corner} 0`;
  const bracketLen = getLength(bracket);
  const bracketEvolved = evolvePath(progress, bracket);

  return (
    <AbsoluteFill
      style={{
        opacity: alpha,
        color: accent,
        fontFamily: theme.fontSans,
        pointerEvents: "none",
      }}
    >
      {/* Four animated corner brackets */}
      {([
        { x: inset, y: inset, rot: 0 },
        { x: width - inset, y: inset, rot: 90 },
        { x: width - inset, y: height - inset, rot: 180 },
        { x: inset, y: height - inset, rot: 270 },
      ] as const).map((c, i) => (
        <svg
          key={i}
          width={corner}
          height={corner}
          style={{
            position: "absolute",
            left: c.x,
            top: c.y,
            transform: `translate(-50%, -50%) rotate(${c.rot}deg)`,
            overflow: "visible",
          }}
        >
          <path
            d={bracket}
            stroke={accent}
            strokeWidth={3}
            fill="none"
            strokeDasharray={bracketEvolved.strokeDasharray}
            strokeDashoffset={bracketEvolved.strokeDashoffset}
            style={{
              filter: `drop-shadow(0 0 6px ${accent})`,
            }}
          />
          <title>{`${bracketLen.toFixed(0)}px HUD bracket`}</title>
        </svg>
      ))}

      {/* Radar ring lower-right */}
      <div
        style={{
          position: "absolute",
          right: inset,
          bottom: inset,
          width: width * 0.1,
          height: width * 0.1,
          transform: "translate(-50%, -50%)",
        }}
      >
        <Circle
          radius={(width * 0.1) / 2}
          fill="none"
          stroke={accent}
          strokeWidth={2}
        />
        <div
          style={{
            position: "absolute",
            inset: 0,
            borderRadius: "50%",
            transform: `rotate(${sweepAngle}deg)`,
            background: `conic-gradient(from 0deg, ${accent}66 0deg, transparent 90deg)`,
            mixBlendMode: "screen",
          }}
        />
      </div>

      {/* Top-center live label */}
      <div
        style={{
          position: "absolute",
          top: inset,
          left: "50%",
          transform: "translateX(-50%)",
          padding: `${height * 0.008}px ${width * 0.015}px`,
          border: `1px solid ${accent}`,
          borderRadius: 999,
          fontSize: (width / 3840) * 36,
          fontWeight: 700,
          letterSpacing: "0.18em",
          textTransform: "uppercase",
          background: "rgba(0,0,0,0.35)",
          backdropFilter: "blur(6px)",
          boxShadow: `0 0 24px ${accent}55 inset`,
        }}
      >
        <span
          style={{
            display: "inline-block",
            width: 10,
            height: 10,
            marginRight: 10,
            borderRadius: "50%",
            background: accent,
            boxShadow: `0 0 12px ${accent}`,
          }}
        />
        {label}
      </div>
    </AbsoluteFill>
  );
};
