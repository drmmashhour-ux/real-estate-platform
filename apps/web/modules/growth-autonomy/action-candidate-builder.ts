import { runAcquisitionOptimization } from "./engines/acquisition.engine";
import { runActivationOptimization } from "./engines/activation.engine";
import { runRetentionOptimization } from "./engines/retention.engine";
import { runMonetizationOptimization } from "./engines/monetization.engine";
import { GrowthActionCandidate, GrowthChannel } from "./growth.types";

/**
 * Generates safe growth action candidates for admin approval.
 */
export async function buildGrowthActionCandidates(): Promise<GrowthActionCandidate[]> {
  const [acq, act, ret, mon] = await Promise.all([
    runAcquisitionOptimization(),
    runActivationOptimization(),
    runRetentionOptimization(),
    runMonetizationOptimization(),
  ]);

  const candidates: GrowthActionCandidate[] = [];

  acq.suggestions.forEach((s, i) => {
    candidates.push({
      id: `acq-${i}`,
      type: "HYPOTHESIS_EXPERIMENT",
      description: s,
      channel: s.toLowerCase().includes("landing") ? "LANDING" : "CONTENT",
      priority: 8,
      requiresApproval: true,
    });
  });

  act.suggestions.forEach((s, i) => {
    candidates.push({
      id: `act-${i}`,
      type: "ONBOARDING_TWEAK",
      description: s,
      channel: "ONBOARDING",
      priority: 9,
      requiresApproval: true,
    });
  });

  mon.suggestions.forEach((s, i) => {
    candidates.push({
      id: `mon-${i}`,
      type: "PRICING_TEST",
      description: s,
      channel: "PRICING",
      priority: 7,
      requiresApproval: true,
    });
  });

  return candidates.sort((a, b) => b.priority - a.priority);
}
