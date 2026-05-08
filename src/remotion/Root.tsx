import { Composition } from "remotion";
import { Main, mainDefaults, type MainCompositionProps } from "./Main";

/**
 * The single source of truth for render-able compositions. The Studio
 * Player references the "Main" composition by id.
 *
 * Default: 4K UHD 30fps. durationInFrames is derived from the prop-driven
 * scene lengths via calculateMetadata so the inspector can change scene
 * durations live without mismatched timelines.
 */
export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="Main"
        component={Main}
        // 4K UHD default; width/height are authoritative at render time.
        width={3840}
        height={2160}
        fps={30}
        // durationInFrames is recomputed by calculateMetadata below.
        durationInFrames={mainDefaults.titleDuration + mainDefaults.outroDuration}
        defaultProps={mainDefaults}
        calculateMetadata={({ props }) => {
          const p = props as MainCompositionProps;
          return {
            durationInFrames: Math.max(30, p.titleDuration + p.outroDuration),
          };
        }}
      />
    </>
  );
};
