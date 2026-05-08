import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { theme } from "../theme";

export interface TitleCardProps {
  title: string;
  subtitle?: string;
  transparentBackground?: boolean;
}

export const titleCardDefaults: TitleCardProps = {
  title: "Remotion Studio Tools Microstock",
  subtitle: "Multi-provider AI + live 4K 30fps video studio",
  transparentBackground: false,
};

/**
 * Animated title card with a spring-driven entrance. The background is a
 * radial gradient that echoes the app shell, suppressed when rendering to
 * a transparent target (ProRes 4444 / WebM alpha).
 */
export const TitleCard: React.FC<TitleCardProps> = ({
  title,
  subtitle,
  transparentBackground,
}) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();

  const titleScale = spring({
    frame,
    fps,
    config: { damping: 18, mass: 0.6, stiffness: 120 },
    from: 0.85,
    to: 1,
  });

  const titleOpacity = interpolate(frame, [0, 12], [0, 1], {
    extrapolateRight: "clamp",
  });

  const subtitleShift = interpolate(frame, [8, 32], [24, 0], {
    extrapolateRight: "clamp",
  });

  const subtitleOpacity = interpolate(frame, [8, 32], [0, 1], {
    extrapolateRight: "clamp",
  });

  const background = transparentBackground
    ? "transparent"
    : `radial-gradient(ellipse 70% 60% at 50% 40%, ${theme.accent}33 0%, transparent 60%), ${theme.bg}`;

  // Scale typography relative to a 4K canvas for readability at any size.
  const titleSize = (width / 3840) * 220;
  const subtitleSize = (width / 3840) * 60;

  return (
    <AbsoluteFill
      style={{
        background,
        fontFamily: theme.fontSans,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexDirection: "column",
        padding: width * 0.08,
        textAlign: "center",
      }}
    >
      <div
        style={{
          transform: `scale(${titleScale})`,
          opacity: titleOpacity,
          fontSize: titleSize,
          fontWeight: 800,
          letterSpacing: "-0.03em",
          lineHeight: 1.05,
          backgroundImage: theme.gradient,
          WebkitBackgroundClip: "text",
          backgroundClip: "text",
          color: "transparent",
          maxWidth: width * 0.78,
        }}
      >
        {title}
      </div>
      {subtitle && (
        <div
          style={{
            transform: `translateY(${subtitleShift}px)`,
            opacity: subtitleOpacity,
            marginTop: (height / 2160) * 56,
            color: theme.muted,
            fontSize: subtitleSize,
            fontWeight: 500,
            letterSpacing: "-0.01em",
            maxWidth: width * 0.7,
          }}
        >
          {subtitle}
        </div>
      )}
    </AbsoluteFill>
  );
};
