/**
 * Safe influence hints for existing CRO / ads advisory panels — suggestions only.
 */

import { growthFusionFlags } from "@/config/feature-flags";
import type { GrowthFusionAction, GrowthFusionSource } from "./growth-fusion.types";

export type GrowthFusionInfluenceBridgeHints = {
  cro: { title: string; description: string; why: string }[];
  ads: { title: string; description: string; why: string }[];
};

function take(source: GrowthFusionSource, actions: GrowthFusionAction[]): GrowthFusionAction[] {
  return actions.filter((a) => a.source === source).slice(0, 4);
}

/**
 * Maps high-priority fusion actions into panel-friendly hints (no mutations to ads/CRO engines).
 */
export function buildGrowthFusionInfluenceBridge(actions: GrowthFusionAction[]): GrowthFusionInfluenceBridgeHints | null {
  if (!growthFusionFlags.growthFusionInfluenceBridgeV1) {
    return null;
  }

  const cro = take("cro", actions).map((a) => ({
    title: a.title,
    description: a.description,
    why: a.why,
  }));
  const ads = take("ads", actions).map((a) => ({
    title: a.title,
    description: a.description,
    why: a.why,
  }));

  return { cro, ads };
}
