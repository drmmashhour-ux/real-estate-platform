import type { MediaClassificationResult, MediaSceneCategory } from "@/lib/trustgraph/domain/media";
import { getPhase6MoatConfig } from "@/lib/trustgraph/config/phase6-moat";

function categoryFromTag(raw: string): MediaSceneCategory {
  const u = raw.toUpperCase();
  if (u.includes("EXTERIOR")) return "exterior";
  if (u.includes("INTERIOR")) return "interior";
  if (u.includes("STREET")) return "street";
  if (u.includes("DOC")) return "document";
  return "unknown";
}

/** Deterministic mapping from seller-provided tags — model can replace later. */
export function classifySceneFromPhotoTag(tag: string): MediaClassificationResult {
  const cfg = getPhase6MoatConfig().media;
  const category = categoryFromTag(tag);
  const confidence = category === "unknown" ? 0.25 : 0.72;
  return {
    category,
    confidence,
    engineVersion: cfg.classificationEngineVersion,
    source: "stub_heuristic",
  };
}
