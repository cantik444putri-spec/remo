import { Composition } from "remotion";
import { Main, mainDefaults, type MainCompositionProps } from "./Main";

/**
 * The single source of truth for render-able compositions. The Studio
 * Player references the "Main" composition by id.
 *
 * Default: 4K UHD 60fps for cinematic smoothness. durationInFrames is
 * derived from the prop-driven scene lengths via calculateMetadata so
 * the inspector can change scene durations live without mismatched
 * timelines.
 */
export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="Main"
        component={Main}
        // 4K UHD at 60fps by default; width/height/fps are authoritative
        // at render time and get overridden per preset by the Studio.
        width={3840}
        height={2160}
        fps={60}
        durationInFrames={mainDefaults.titleDuration + mainDefaults.outroDuration}
        defaultProps={mainDefaults}
        calculateMetadata={({ props }) => {
          const p = props as MainCompositionProps;
          // TransitionSeries overlaps scenes by transitionDuration, so the
          // effective composition length is titleDuration + outroDuration.
          return {
            durationInFrames: Math.max(60, p.titleDuration + p.outroDuration),
          };
        }}
      />
    </>
  );
};
