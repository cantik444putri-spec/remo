import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { MotionBlur } from "@remotion/motion-blur";
import { loadFont } from "@remotion/google-fonts/Inter";
import { theme } from "../theme";
import { cinematicSpring, kf } from "../animations";

const { fontFamily } = loadFont("normal", {
  weights: ["600", "700", "800"],
});

export interface OutroCTAProps {
  heading: string;
  callToAction: string;
  transparentBackground?: boolean;
}

export const outroCTADefaults: OutroCTAProps = {
  heading: "Thanks for watching",
  callToAction: "Subscribe · remotion.dev",
  transparentBackground: false,
};

export const OutroCTA: React.FC<OutroCTAProps> = ({
  heading,
  callToAction,
  transparentBackground,
}) => {
  const frame = useCurrentFrame();
  const { width, height, fps, durationInFrames } = useVideoConfig();

  const alphaIn = kf(frame, [0, 18], [0, 1]);
  const alphaOut = kf(frame, [durationInFrames - 12, durationInFrames], [1, 0]);
  const alpha = Math.min(alphaIn, alphaOut);

  const ctaScale = cinematicSpring({ frame, fps, from: 0.9, to: 1, delay: 10 });

  const background = transparentBackground
    ? "transparent"
    : `radial-gradient(ellipse 60% 60% at 50% 50%, ${theme.accent2}33, transparent 60%), ${theme.bg}`;

  return (
    <AbsoluteFill
      style={{
        background,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexDirection: "column",
        padding: width * 0.08,
        textAlign: "center",
        fontFamily,
        opacity: alpha,
      }}
    >
      <MotionBlur lagInFrames={1}>
        <div
          style={{
            fontSize: (width / 3840) * 180,
            fontWeight: 800,
            letterSpacing: "-0.03em",
            color: theme.fg,
          }}
        >
          {heading}
        </div>
      </MotionBlur>
      <div
        style={{
          marginTop: (height / 2160) * 40,
          fontSize: (width / 3840) * 70,
          fontWeight: 700,
          padding: `${(height / 2160) * 20}px ${(width / 3840) * 52}px`,
          borderRadius: 999,
          backgroundImage: theme.gradient,
          color: "#fff",
          boxShadow: "0 20px 60px -20px rgba(168,85,247,0.6)",
          transform: `scale(${ctaScale})`,
        }}
      >
        {callToAction}
      </div>
    </AbsoluteFill>
  );
};
