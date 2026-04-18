/**
 * Optional presentation-only influence (never execution). Placeholder for future bounded overlays.
 */
import { fusionSystemFlags } from "@/config/feature-flags";
import type { FusionInfluenceOverlay, FusionSnapshot } from "./fusion-system.types";

/** Returns null when influence flag is off — no ranking/presentation changes. */
export function buildFusionInfluenceOverlay(snapshot: FusionSnapshot): FusionInfluenceOverlay | null {
  if (!fusionSystemFlags.fusionSystemInfluenceV1) {
    return null;
  }
  const tags: Record<string, string[]> = {};
  for (const r of snapshot.recommendations) {
    const k = `rec:${r.kind}`;
    tags[k] = [...(tags[k] ?? []), "fusion_v1_advisory"];
  }
  return {
    rankingNudges: [],
    tagsByTarget: tags,
  };
}
