import { getFunnelSnapshot } from "../context.service";

/**
 * Optimizes acquisition source/channel mix.
 */
export async function runAcquisitionOptimization() {
  const snapshot = await getFunnelSnapshot();
  const suggestions: string[] = [];

  if (snapshot.landingConversion < 0.03) {
    suggestions.push("Run A/B test on hero headline emphasizing 'No upfront fees'");
    suggestions.push("Promote broker success stories higher on landing page");
  }

  if (snapshot.referralUsage < 0.05) {
    suggestions.push("Integrate referral prompt into broker dashboard footer");
  }

  return { suggestions };
}
