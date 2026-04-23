import type {
  AutoVideoJob,
  AutoVideoRenderManifestV1,
  AutoVideoRequest,
  AutoVideoScene,
} from "./auto-video.types";
import { getBrandingRules } from "./auto-video-branding.service";

export function createManifest(
  request: AutoVideoRequest,
  scenes: AutoVideoScene[]
): AutoVideoRenderManifestV1 {
  let currentTime = 0;
  const manifestScenes = scenes.map((s, index) => {
    const start = currentTime;
    const end = currentTime + s.durationSec;
    currentTime = end;

    const backgroundMedia = request.mediaAssets.find(m => m.id === s.backgroundMediaId);

    return {
      id: s.id,
      order: index,
      kind: s.kind,
      startSec: start,
      endSec: end,
      background: backgroundMedia ? {
        type: backgroundMedia.kind === "video" ? "video" : "image",
        ref: backgroundMedia.url,
      } : { type: "solid", solidHex: "#000000" },
      textOverlays: s.overlayLines.map((line, lIdx) => ({
        id: `${s.id}_txt_${lIdx}`,
        text: line.text,
        startSec: start + line.timing.startSec,
        endSec: start + line.timing.endSec,
        style: {
          sizePx: line.role === "headline" ? 64 : 32,
          colorHex: line.role === "headline" ? "#C9A227" : "#FFFFFF",
          align: "center",
        },
      })),
      transitionToNext: s.transition,
      badge: s.badge,
    };
  });

  return {
    version: 1,
    requestId: request.id,
    targetPlatform: request.targetPlatform,
    aspectRatio: request.targetAspectRatio,
    totalDurationSec: currentTime,
    frameRate: 30,
    scenes: manifestScenes,
    soundtrack: { assetId: "default_luxury", volume: 0.5, fadeInSec: 1, fadeOutSec: 2 },
    branding: getBrandingRules(),
    export: { format: "mp4", container: "h264", maxBitrateKbps: 8000, audioKbps: 192 },
    generatedAtIso: new Date().toISOString(),
  };
}
