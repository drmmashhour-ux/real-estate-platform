import type { AutoVideoScene, TextTiming } from "./auto-video.types";

const SCENE_DURATIONS = {
  HOOK: 3,
  FEATURE: 5,
  PRICING: 4,
  LOCATION: 5,
  CTA: 4,
  BRAND: 3,
};

export function buildScene(
  kind: AutoVideoScene["kind"],
  label: string,
  copy: { headline: string; sub?: string; voiceover?: string },
  mediaId?: string,
  badge?: AutoVideoScene["badge"]
): AutoVideoScene {
  const duration = SCENE_DURATIONS[kind] || 4;
  
  const overlayLines: AutoVideoScene["overlayLines"] = [
    {
      text: copy.headline,
      timing: { startSec: 0.5, endSec: duration - 0.5 },
      role: "headline",
    },
  ];

  if (copy.sub) {
    overlayLines.push({
      text: copy.sub,
      timing: { startSec: 1.0, endSec: duration - 1.0 },
      role: "sub",
    });
  }

  return {
    id: `scene_${kind.toLowerCase()}_${Math.random().toString(36).slice(2, 7)}`,
    kind,
    label,
    durationSec: duration,
    backgroundMediaId: mediaId,
    overlayLines,
    badge,
    transition: "crossfade",
    voiceoverHint: copy.voiceover,
  };
}

export function buildStoryboard(
  scenes: AutoVideoScene[]
): string {
  return scenes
    .map((s, i) => `${i + 1}. ${s.label}: ${s.overlayLines.map(l => l.text).join(" | ")} (${s.durationSec}s)`)
    .join("\n");
}
