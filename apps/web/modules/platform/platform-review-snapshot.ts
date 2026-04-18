/**
 * Read-only feature snapshot for deterministic platform reviews (no I/O).
 */

import {
  aiResponseDeskFlags,
  engineFlags,
  featureFlags,
  growthFusionFlags,
  growthMissionControlFlags,
} from "@/config/feature-flags";

/** Re-export for tests — inject partial overrides. */
export type PlatformReviewSnapshot = {
  demoMode: boolean;
  billingV1: boolean;
  subscriptionsV1: boolean;
  featuredListingsV1: boolean;
  trustIndicatorsV1: boolean;
  listingMetricsV1: boolean;
  growthMachineV1: boolean;
  growthRevenuePanelV1: boolean;
  brokerAcquisitionV1: boolean;
  growthMissionControlV1: boolean;
  growthFusionV1: boolean;
  recommendationsV1: boolean;
  conversionOptimizationV1: boolean;
  aiResponseDeskV1: boolean;
  hostAcquisitionV1: boolean;
  rankingV2: boolean;
};

export function mergeTestPlatformReviewSnapshot(
  overrides: Partial<PlatformReviewSnapshot>,
): PlatformReviewSnapshot {
  return { ...getDefaultPlatformReviewSnapshot(), ...overrides };
}

export function getDefaultPlatformReviewSnapshot(): PlatformReviewSnapshot {
  return {
    demoMode: featureFlags.demoMode,
    billingV1: engineFlags.billingV1,
    subscriptionsV1: engineFlags.subscriptionsV1,
    featuredListingsV1: engineFlags.featuredListingsV1,
    trustIndicatorsV1: engineFlags.trustIndicatorsV1,
    listingMetricsV1: engineFlags.listingMetricsV1,
    growthMachineV1: engineFlags.growthMachineV1,
    growthRevenuePanelV1: engineFlags.growthRevenuePanelV1,
    brokerAcquisitionV1: engineFlags.brokerAcquisitionV1,
    growthMissionControlV1: growthMissionControlFlags.growthMissionControlV1,
    growthFusionV1: growthFusionFlags.growthFusionV1,
    recommendationsV1: engineFlags.recommendationsV1,
    conversionOptimizationV1: engineFlags.conversionOptimizationV1,
    aiResponseDeskV1: aiResponseDeskFlags.aiResponseDeskV1,
    hostAcquisitionV1: engineFlags.hostAcquisitionV1,
    rankingV2: engineFlags.rankingV2,
  };
}
