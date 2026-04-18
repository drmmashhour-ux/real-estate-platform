/**
 * Data moat readiness — signals captured vs missing (advisory; no new pipelines).
 */

import type { PlatformDataMoatReviewResult } from "./platform-improvement.types";
import type { PlatformReviewSnapshot } from "./platform-review-snapshot";
import { getDefaultPlatformReviewSnapshot } from "./platform-review-snapshot";

export function buildPlatformDataMoatReview(
  snapshot: PlatformReviewSnapshot = getDefaultPlatformReviewSnapshot(),
): PlatformDataMoatReviewResult {
  const capturedSignals: string[] = [
    "Listing views and saves (when listing metrics / engagement paths are on).",
    "Lead creation events and CRM stages (core lead flows).",
    "Booking funnel progression for BNHub when checkout is used.",
    "Ranking exposure and featured placement when ranking v2 / featured listings are on.",
  ];
  if (snapshot.listingMetricsV1) capturedSignals.push("Listing performance snapshots (FsboListingMetrics when enabled).");
  if (snapshot.growthFusionV1) capturedSignals.push("Fusion cross-domain signals for advisory layers.");
  if (snapshot.recommendationsV1) capturedSignals.push("Recommendation rails for listing affinity.");

  const missingHighValueSignals: string[] = [
    "Longitudinal lead quality score (beyond raw counts).",
    "Broker behavior time-on-task across territories (unless CRM exports are joined manually).",
    "Guest repeat-booking propensity at platform level.",
    "Neighborhood demand index (unless market intelligence bundle is fully deployed).",
  ];
  if (!snapshot.listingMetricsV1) {
    missingHighValueSignals.push("Granular listing engagement time-series for moat analytics.");
  }
  if (!snapshot.conversionOptimizationV1) {
    missingHighValueSignals.push("Structured CRO experiment outcomes tied to revenue.");
  }

  const strongestMoatCandidates = [
    "Exclusive booking + payout history on BNHub for supply-side lock-in.",
    "Broker pipeline + commission events tied to platform ID.",
    "Ranking + featured interaction data for pricing power on visibility.",
  ];

  const notes = [
    "This review does not enable new collectors — it guides where to invest next.",
    "Avoid storing sensitive payment artifacts beyond what Stripe already retains.",
  ];

  return { capturedSignals, missingHighValueSignals, strongestMoatCandidates, notes };
}
