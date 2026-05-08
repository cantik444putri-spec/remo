import { AbsoluteFill, Sequence } from "remotion";
import { TitleCard, titleCardDefaults, type TitleCardProps } from "./scenes/TitleCard";
import { LowerThird, lowerThirdDefaults, type LowerThirdProps } from "./scenes/LowerThird";
import { OutroCTA, outroCTADefaults, type OutroCTAProps } from "./scenes/OutroCTA";

export interface MainCompositionProps {
  /** When true, suppress opaque backgrounds for ProRes 4444 / alpha WebM. */
  transparentBackground: boolean;
  /** Optional background color applied when transparent is off and no scene draws one. */
  backgroundColor: string;
  /** Frames allocated to the title card scene. */
  titleDuration: number;
  /** Frames allocated to the outro scene. */
  outroDuration: number;
  title: TitleCardProps;
  lowerThird: LowerThirdProps;
  outro: OutroCTAProps;
}

export const mainDefaults: MainCompositionProps = {
  transparentBackground: false,
  backgroundColor: "#0a0a0f",
  titleDuration: 150,  // 5s @ 30fps
  outroDuration: 120,  // 4s @ 30fps
  title: titleCardDefaults,
  lowerThird: { ...lowerThirdDefaults },
  outro: outroCTADefaults,
};

/**
 * Default composition used by the Studio Player. The timeline is:
 *
 *   [ TitleCard (5s) ][ LowerThird overlay from 4s to 8s ][ OutroCTA (4s) ]
 *
 * Everything is data-driven via props so the Studio inspector can edit
 * durations and copy live without reloading the composition.
 */
export const Main: React.FC<MainCompositionProps> = ({
  transparentBackground,
  backgroundColor,
  titleDuration,
  outroDuration,
  title,
  lowerThird,
  outro,
}) => {
  const background = transparentBackground ? "transparent" : backgroundColor;

  return (
    <AbsoluteFill style={{ background }}>
      <Sequence from={0} durationInFrames={titleDuration} layout="none">
        <TitleCard {...title} transparentBackground={transparentBackground} />
      </Sequence>

      <Sequence
        from={Math.max(0, titleDuration - 30)}
        durationInFrames={titleDuration + 30}
        layout="none"
      >
        <LowerThird {...lowerThird} />
      </Sequence>

      <Sequence from={titleDuration} durationInFrames={outroDuration} layout="none">
        <OutroCTA {...outro} transparentBackground={transparentBackground} />
      </Sequence>
    </AbsoluteFill>
  );
};
