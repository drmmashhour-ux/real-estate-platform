/**
 * Shared capability flag keys for env-driven rollout — apps map env → booleans.
 */

export type GlobalMultiRegionFeatureFlags = {
  globalMultiRegionV1: boolean;
  globalDashboardV1: boolean;
  regionAdaptersV1: boolean;
  regionAwareAutonomyV1: boolean;
  globalDominationV1: boolean;
};
