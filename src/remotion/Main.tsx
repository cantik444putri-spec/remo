import { AbsoluteFill, Sequence } from "remotion";
import {
  TransitionSeries,
  linearTiming,
  springTiming,
} from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import { slide } from "@remotion/transitions/slide";
import {
  TitleCard,
  titleCardDefaults,
  type TitleCardProps,
} from "./scenes/TitleCard";
import {
  LowerThird,
  lowerThirdDefaults,
  type LowerThirdProps,
} from "./scenes/LowerThird";
import {
  OutroCTA,
  outroCTADefaults,
  type OutroCTAProps,
} from "./scenes/OutroCTA";
import {
  HudOverlay,
  hudOverlayDefaults,
  type HudOverlayProps,
} from "./scenes/HudOverlay";
import {
  ParticleField,
  particleFieldDefaults,
  type ParticleFieldProps,
} from "./scenes/ParticleField";

export interface MainCompositionProps {
  /** When true, suppress opaque backgrounds for ProRes 4444 / alpha WebM. */
  transparentBackground: boolean;
  /** Optional background color applied when transparent is off and no scene draws one. */
  backgroundColor: string;
  /** Show the animated particle backdrop. */
  showParticles: boolean;
  /** Show the HUD bracket overlay. */
  showHud: boolean;
  /** Frames allocated to the title card scene. */
  titleDuration: number;
  /** Frames allocated to the outro scene. */
  outroDuration: number;
  /** Transition frames between title and outro. */
  transitionDuration: number;
  title: TitleCardProps;
  lowerThird: LowerThirdProps;
  outro: OutroCTAProps;
  hud: HudOverlayProps;
  particles: ParticleFieldProps;
}

export const mainDefaults: MainCompositionProps = {
  transparentBackground: false,
  backgroundColor: "#0a0a0f",
  showParticles: true,
  showHud: true,
  titleDuration: 150, // 2.5s @ 60fps
  outroDuration: 150, // 2.5s @ 60fps
  transitionDuration: 30, // 0.5s
  title: titleCardDefaults,
  lowerThird: { ...lowerThirdDefaults },
  outro: outroCTADefaults,
  hud: hudOverlayDefaults,
  particles: particleFieldDefaults,
};

/**
 * Default composition used by the Studio Player. The timeline is:
 *
 *   [ ParticleField (full length, optional) ]
 *   [ TitleCard ] --slide--> [ OutroCTA ]
 *                 [ LowerThird overlay from title tail into outro head ]
 *   [ HudOverlay (full length, optional) ]
 *
 * Everything is data-driven via props so the Studio inspector can edit
 * durations and copy live without reloading the composition.
 */
export const Main: React.FC<MainCompositionProps> = ({
  transparentBackground,
  backgroundColor,
  showParticles,
  showHud,
  titleDuration,
  outroDuration,
  transitionDuration,
  title,
  lowerThird,
  outro,
  hud,
  particles,
}) => {
  const totalDuration = titleDuration + outroDuration;
  const background = transparentBackground ? "transparent" : backgroundColor;

  return (
    <AbsoluteFill style={{ background }}>
      {showParticles && (
        <Sequence from={0} durationInFrames={totalDuration} layout="none">
          <ParticleField
            {...particles}
            transparentBackground={transparentBackground}
          />
        </Sequence>
      )}

      <TransitionSeries>
        <TransitionSeries.Sequence durationInFrames={titleDuration}>
          <TitleCard {...title} transparentBackground={transparentBackground} />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition
          presentation={slide({ direction: "from-right" })}
          timing={springTiming({
            config: { damping: 18, mass: 0.6, stiffness: 130 },
            durationInFrames: transitionDuration,
          })}
        />
        <TransitionSeries.Sequence durationInFrames={outroDuration}>
          <OutroCTA {...outro} transparentBackground={transparentBackground} />
        </TransitionSeries.Sequence>
      </TransitionSeries>

      {/* Lower-third spans the final portion of the title card and
          eases out just after the transition starts. Using a plain
          Sequence because TransitionSeries siblings would hide it. */}
      <Sequence
        from={Math.max(0, titleDuration - 45)}
        durationInFrames={90}
        layout="none"
      >
        <TransitionSeries>
          <TransitionSeries.Sequence durationInFrames={45}>
            <LowerThird {...lowerThird} />
          </TransitionSeries.Sequence>
          <TransitionSeries.Transition
            presentation={fade()}
            timing={linearTiming({ durationInFrames: 15 })}
          />
          <TransitionSeries.Sequence durationInFrames={30}>
            <LowerThird {...lowerThird} />
          </TransitionSeries.Sequence>
        </TransitionSeries>
      </Sequence>

      {showHud && (
        <Sequence from={0} durationInFrames={totalDuration} layout="none">
          <HudOverlay {...hud} />
        </Sequence>
      )}
    </AbsoluteFill>
  );
};
