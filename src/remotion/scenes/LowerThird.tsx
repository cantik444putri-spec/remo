import {
  AbsoluteFill,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { loadFont } from "@remotion/google-fonts/Inter";
import { theme } from "../theme";
import { cinematicSpring } from "../animations";

const { fontFamily } = loadFont("normal", {
  weights: ["500", "700"],
});

export interface LowerThirdProps {
  name: string;
  tagline?: string;
  position?: "left" | "right";
}

export const lowerThirdDefaults: LowerThirdProps = {
  name: "Your name",
  tagline: "Creator · Microstock",
  position: "left",
};

/**
 * A lower-third banner that springs in from the side. Composable as a
 * <Sequence> over any other scene via the main composition.
 */
export const LowerThird: React.FC<LowerThirdProps> = ({
  name,
  tagline,
  position = "left",
}) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();

  const entry = cinematicSpring({ frame, fps });
  const side = position === "left" ? "flex-start" : "flex-end";
  const translateX =
    position === "left"
      ? interpolate(entry, [0, 1], [-40, 0])
      : interpolate(entry, [0, 1], [40, 0]);

  const nameSize = (width / 3840) * 80;
  const taglineSize = (width / 3840) * 40;

  return (
    <AbsoluteFill
      style={{
        display: "flex",
        alignItems: "flex-end",
        justifyContent: side,
        padding: width * 0.05,
        paddingBottom: height * 0.12,
        fontFamily,
      }}
    >
      <div
        style={{
          transform: `translateX(${translateX}%)`,
          opacity: entry,
          display: "flex",
          flexDirection: "column",
          gap: 8,
          padding: `${(height / 2160) * 28}px ${(width / 3840) * 40}px`,
          borderRadius: 20,
          background: "rgba(10, 10, 16, 0.75)",
          backdropFilter: "blur(18px)",
          border: `1px solid ${theme.border}`,
          boxShadow: "0 30px 60px -20px rgba(0,0,0,0.6)",
          color: theme.fg,
        }}
      >
        <div
          style={{
            fontSize: nameSize,
            fontWeight: 700,
            letterSpacing: "-0.02em",
          }}
        >
          {name}
        </div>
        {tagline && (
          <div
            style={{
              fontSize: taglineSize,
              fontWeight: 500,
              color: theme.muted,
            }}
          >
            {tagline}
          </div>
        )}
      </div>
    </AbsoluteFill>
  );
};
