import { useMemo, useRef } from "react";
import { Player, type PlayerRef } from "@remotion/player";
import { useStudioStore } from "@/stores/studio";
import { useSettingsStore } from "@/stores/settings";
import { Main, type MainCompositionProps } from "@/remotion/Main";
import { getPreset } from "@/remotion/presets";
import { SafeAreaOverlay } from "./SafeAreaOverlay";

/**
 * Wraps @remotion/player, sizing the canvas to the preset's aspect ratio
 * and passing the live composition props. The player re-renders cheaply
 * whenever the Studio store's composition/preset changes.
 */
export function PlayerShell() {
  const composition = useStudioStore((s) => s.composition);
  const presetId = useStudioStore((s) => s.presetId);
  const safeArea = useStudioStore((s) => s.safeArea);
  const preset = useMemo(() => getPreset(presetId), [presetId]);
  const durationInFrames = Math.max(
    30,
    composition.titleDuration + composition.outroDuration,
  );
  const playerRef = useRef<PlayerRef>(null);

  // Remotion player accepts an acknowledgement boolean stating the caller
  // has read the license. Return true when the user has checked the free
  // eligibility box OR has pasted a company key in Settings.
  const eligibleFree = useSettingsStore((s) => s.remotionEligibleFree);
  const companyKey = useSettingsStore((s) => s.remotionCompanyLicenseKey);
  const acknowledgeRemotionLicense = eligibleFree || !!companyKey;

  return (
    <div className="relative flex h-full w-full items-center justify-center bg-black">
      <div
        className="relative h-full w-full"
        style={{
          // Show a checkerboard when the output is meant to be transparent
          // so creators can see alpha clearly in the preview.
          background: composition.transparentBackground
            ? "conic-gradient(from 0deg, #1a1a1a 0deg 90deg, #0a0a0a 90deg 180deg, #1a1a1a 180deg 270deg, #0a0a0a 270deg 360deg)"
            : "#000",
          backgroundSize: composition.transparentBackground ? "24px 24px" : undefined,
        }}
      >
        <Player<MainCompositionProps>
          ref={playerRef}
          component={Main}
          compositionWidth={preset.width}
          compositionHeight={preset.height}
          fps={preset.fps}
          durationInFrames={durationInFrames}
          inputProps={composition}
          controls
          loop
          acknowledgeRemotionLicense={acknowledgeRemotionLicense}
          style={{
            width: "100%",
            height: "100%",
          }}
          clickToPlay
          doubleClickToFullscreen
          spaceKeyToPlayOrPause
          numberOfSharedAudioTags={0}
        />
        {safeArea !== "off" && (
          <SafeAreaOverlay mode={safeArea} />
        )}
      </div>
    </div>
  );
}
