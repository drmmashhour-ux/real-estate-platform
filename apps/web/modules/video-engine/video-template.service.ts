import type { VideoAspectRatio, VideoSceneType, VideoScriptVm } from "./video-engine.types";

/** LECIPM premium brand — black + gold (aligned with Marketing Hub) */
export const VIDEO_BRAND = {
  background: "#050505",
  accent: "#D4AF37",
  titleFont: "Georgia, 'Times New Roman', serif",
  bodyFont: "system-ui, -apple-system, sans-serif",
  maxCaptionLength: 220,
} as const;

export const DEFAULT_SOUNDTRACK_REF = "library:ambient_luxury_v1"; // placeholder — swap for licensed asset

export function defaultAspectForPlatform(platform: string): VideoAspectRatio {
  if (platform === "linkedin") return "16:9";
  if (platform === "instagram_reels" || platform === "instagram") return "1:1";
  return "9:16";
}

export function defaultAspectForScriptPlatform(tp: VideoScriptVm["targetPlatform"]): VideoAspectRatio {
  if (tp === "linkedin") return "16:9";
  if (tp === "instagram_reels") return "1:1";
  return "9:16";
}

export function scenePreset(type: VideoSceneType): { transitionIn: string; transitionOut: string } {
  switch (type) {
    case "hero_image":
      return { transitionIn: "fade", transitionOut: "crossfade" };
    case "details_card":
      return { transitionIn: "slide_up", transitionOut: "crossfade" };
    case "pricing_card":
      return { transitionIn: "fade", transitionOut: "crossfade" };
    case "area_spotlight":
      return { transitionIn: "ken_burns_soft", transitionOut: "crossfade" };
    case "cta_card":
      return { transitionIn: "fade", transitionOut: "none" };
    default:
      return { transitionIn: "fade", transitionOut: "crossfade" };
  }
}

export function ctaEndCard(title: string, subtitle: string): { title: string; subtitle: string; durationSec: number } {
  return {
    title: title.slice(0, 80),
    subtitle: subtitle.slice(0, 120),
    durationSec: 2.5,
  };
}
