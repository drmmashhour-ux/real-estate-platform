import type { VideoAspectRatio, VideoRenderManifestVm, VideoScriptVm } from "./video-engine.types";
import { VIDEO_BRAND, DEFAULT_SOUNDTRACK_REF, defaultAspectForScriptPlatform, ctaEndCard } from "./video-template.service";

/** Prefer cover-first ordering, dedupe, clamp 4–8 assets */
export function rankMediaUrls(urls: string[], coverUrl?: string | null): { ranked: string[]; warnings: string[] } {
  const warnings: string[] = [];
  const seen = new Set<string>();
  const out: string[] = [];

  if (coverUrl) {
    seen.add(coverUrl);
    out.push(coverUrl);
  }

  for (const u of urls) {
    if (!u || seen.has(u)) continue;
    seen.add(u);
    out.push(u);
    if (out.length >= 8) break;
  }

  if (out.length === 0) warnings.push("No imagery available — voiceover-only or stock placeholder required.");
  else if (out.length < 4) warnings.push(`Only ${out.length} unique images — consider simpler 15s layout.`);

  return { ranked: out.slice(0, 8), warnings };
}

/** Scale scene durations so the sum matches `durationTargetSec` (min 2s per scene). */
export function normalizeSceneDurations(script: VideoScriptVm): VideoScriptVm {
  const target = script.durationTargetSec;
  const raw = script.scenes.map((s) => s.durationSec);
  const sum = raw.reduce((a, b) => a + b, 0) || 1;
  let scaled = raw.map((d) => Math.max(2, Math.round((d / sum) * target)));
  let drift = target - scaled.reduce((a, b) => a + b, 0);
  let i = 0;
  const maxIter = scaled.length * 20;
  let guard = 0;
  while (drift !== 0 && scaled.length > 0 && guard < maxIter) {
    const idx = i % scaled.length;
    const next = scaled[idx] + (drift > 0 ? 1 : -1);
    if (next >= 2) {
      scaled[idx] = next;
      drift += drift > 0 ? -1 : 1;
    }
    i += 1;
    guard += 1;
  }

  const scenes = script.scenes.map((s, idx) => ({
    ...s,
    durationSec: scaled[idx] ?? s.durationSec,
  }));

  return { ...script, scenes };
}

export function buildRenderManifest(
  script: VideoScriptVm,
  rankedUrls: string[],
  aspectRatio?: VideoAspectRatio,
): VideoRenderManifestVm {
  const ar = aspectRatio ?? defaultAspectForScriptPlatform(script.targetPlatform);
  const normalized = normalizeSceneDurations(script);
  const end = ctaEndCard(script.title, script.cta);

  let imgIdx = 0;
  const scenes = normalized.scenes.map((s, i) => {
    let mediaUrl: string | null = null;
    if (s.type !== "cta_card" && rankedUrls.length > 0) {
      mediaUrl = rankedUrls[imgIdx % rankedUrls.length] ?? null;
      imgIdx += 1;
    }
    return {
      sceneId: s.id,
      type: s.type,
      durationSec: s.durationSec,
      mediaUrl,
      overlayText: s.overlayLines,
      transition: s.transitionOut ?? "crossfade",
    };
  });

  const ffmpegPlan =
    rankedUrls.length === 0
      ? []
      : normalized.scenes
          .filter((s) => s.type !== "cta_card")
          .map((s, idx) => ({
            step: idx + 1,
            inputImageIndex: Math.min(idx, Math.max(rankedUrls.length - 1, 0)),
            durationSec: s.durationSec,
            vf:
              ar === "9:16"
                ? "scale=1080:1920:force_original_aspect_ratio=decrease,pad=1080:1920:(ow-iw)/2:(oh-ih)/2:black"
                : undefined,
          }));

  return {
    version: 1,
    brand: {
      background: VIDEO_BRAND.background,
      accent: VIDEO_BRAND.accent,
      titleFont: VIDEO_BRAND.titleFont,
      bodyFont: VIDEO_BRAND.bodyFont,
    },
    aspectRatio: ar,
    durationTargetSec: normalized.durationTargetSec,
    soundtrackRef: DEFAULT_SOUNDTRACK_REF,
    scenes,
    ffmpegPlan,
    ctaEndCard: end,
  };
}
