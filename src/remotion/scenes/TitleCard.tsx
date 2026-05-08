import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { MotionBlur } from "@remotion/motion-blur";
import { loadFont } from "@remotion/google-fonts/Inter";
import { theme } from "../theme";
import { cinematicSpring, easeOutExpo, kf } from "../animations";

// Loading the font from Remotion's registry means the renderer will wait
// for the weights to be embedded before taking frames, so typography is
// pixel-perfect on the server.
const { fontFamily } = loadFont("normal", {
  weights: ["500", "700", "800", "900"],
});

export interface TitleCardProps {
  title: string;
  subtitle?: string;
  transparentBackground?: boolean;
}

export const titleCardDefaults: TitleCardProps = {
  title: "Remotion Studio Tools Microstock",
  subtitle: "Multi-provider AI + live 4K 60fps video studio",
  transparentBackground: false,
};

/**
 * Animated title card with a spring-driven entrance, motion-blurred
 * horizontal drift on the headline, and a gradient mask that wipes in
 * the subtitle. The blur trails make small typography motion feel
 * cinematic on 60fps exports.
 */
export const TitleCard: React.FC<TitleCardProps> = ({
  title,
  subtitle,
  transparentBackground,
}) => {
  const frame = useCurrentFrame();
  const { width, height, fps, durationInFrames } = useVideoConfig();

  const titleScale = cinematicSpring({ frame, fps, from: 0.88, to: 1 });
  const titleOpacity = kf(frame, [0, 12], [0, 1]);

  // Slight parallax drift so motion-blur has something to catch. Tuned
  // small because 4K type at 60fps exaggerates any sub-pixel wobble.
  const drift = interpolate(frame, [0, durationInFrames], [-16, 16]);

  const subtitleShift = interpolate(frame, [8, 32], [24, 0], {
    extrapolateRight: "clamp",
    easing: easeOutExpo,
  });
  const subtitleOpacity = kf(frame, [8, 32], [0, 1]);

  const fadeOut = kf(
    frame,
    [durationInFrames - 15, durationInFrames],
    [1, 0],
  );

  const background = transparentBackground
    ? "transparent"
    : `radial-gradient(ellipse 70% 60% at 50% 40%, ${theme.accent}33 0%, transparent 60%), ${theme.bg}`;

  const titleSize = (width / 3840) * 220;
  const subtitleSize = (width / 3840) * 60;

  return (
    <AbsoluteFill
      style={{
        background,
        fontFamily,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexDirection: "column",
        padding: width * 0.08,
        textAlign: "center",
        opacity: fadeOut,
      }}
    >
      <MotionBlur lagInFrames={1}>
        <div
          style={{
            transform: `translateX(${drift}px) scale(${titleScale})`,
            opacity: titleOpacity,
            fontSize: titleSize,
            fontWeight: 900,
            letterSpacing: "-0.03em",
            lineHeight: 1.05,
            backgroundImage: theme.gradient,
            WebkitBackgroundClip: "text",
            backgroundClip: "text",
            color: "transparent",
            maxWidth: width * 0.78,
            willChange: "transform",
          }}
        >
          {title}
        </div>
      </MotionBlur>
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
