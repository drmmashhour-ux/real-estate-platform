/**
 * Read-only Growth Fusion orchestration — snapshot → analyze → prioritize.
 */

import { growthFusionFlags } from "@/config/feature-flags";
import { analyzeGrowthFusion } from "./growth-fusion-analyzer.service";
import { logGrowthFusionRunStarted, recordGrowthFusionRun } from "./growth-fusion-monitoring.service";
import { prioritizeGrowthFusionActions } from "./growth-fusion-prioritizer.service";
import { buildGrowthFusionSnapshot } from "./growth-fusion-snapshot.service";
import type { GrowthFusionSystemResult } from "./growth-fusion.types";

/**
 * When `FEATURE_GROWTH_FUSION_V1` is off, returns `null` (callers must not treat as failure).
 */
export async function buildGrowthFusionSystem(): Promise<GrowthFusionSystemResult | null> {
  if (!growthFusionFlags.growthFusionV1) {
    return null;
  }

  logGrowthFusionRunStarted();
  const snapshot = await buildGrowthFusionSnapshot();
  const summary = analyzeGrowthFusion(snapshot);
  const actions = prioritizeGrowthFusionActions(summary);
  recordGrowthFusionRun({ snapshot, summary, actions });

  return { snapshot, summary, actions };
}
