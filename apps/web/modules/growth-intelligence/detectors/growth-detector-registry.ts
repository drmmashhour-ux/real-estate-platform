import type { GrowthSnapshot } from "../growth.types";
import type { GrowthSignal } from "../growth.types";
import { dedupeGrowthSignals } from "./growth-detector-utils";
import { detectCampaignEfficiencyShift } from "./campaign-efficiency-shift.detector";
import { detectContentGap } from "./content-gap.detector";
import { detectDemandSupplyImbalance } from "./demand-supply-imbalance.detector";
import { detectHighIntentSearchOpportunity } from "./high-intent-search-opportunity.detector";
import { detectHighPerformingRegion } from "./high-performing-region.detector";
import { detectLeadFormDropoff } from "./lead-form-dropoff.detector";
import { detectLowConversionPage } from "./low-conversion-page.detector";
import { detectSeoGap } from "./seo-gap.detector";
import { detectTrustConversionOpportunity } from "./trust-conversion-opportunity.detector";
import { detectRepeatDropoffPattern } from "./repeat-dropoff-pattern.detector";
import { detectStalledFunnel } from "./stalled-funnel.detector";
import { detectTrendReversal } from "./trend-reversal.detector";
import { detectUnderexposedListingCluster } from "./underexposed-listing-cluster.detector";

const runners: Array<(s: GrowthSnapshot) => GrowthSignal[]> = [
  detectSeoGap,
  detectContentGap,
  detectLowConversionPage,
  detectHighIntentSearchOpportunity,
  detectUnderexposedListingCluster,
  detectHighPerformingRegion,
  detectDemandSupplyImbalance,
  detectLeadFormDropoff,
  detectCampaignEfficiencyShift,
  detectTrustConversionOpportunity,
  detectTrendReversal,
  detectStalledFunnel,
  detectRepeatDropoffPattern,
];

export function runAllGrowthDetectors(snapshot: GrowthSnapshot): GrowthSignal[] {
  const acc: GrowthSignal[] = [];
  for (const run of runners) {
    try {
      acc.push(...run(snapshot));
    } catch {
      /* detector contract: never throw — skip batch on unexpected error */
    }
  }
  return dedupeGrowthSignals(acc);
}
