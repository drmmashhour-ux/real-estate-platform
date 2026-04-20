import { autonomyOsLayerFlags, dynamicPricingFlags } from "@/config/feature-flags";

export function isAutonomyOsLayerCoreEnabled(): boolean {
  return autonomyOsLayerFlags.autonomyCoreV1;
}

export function isAutonomyOsDynamicPricingEnabled(): boolean {
  return autonomyOsLayerFlags.autonomyCoreV1 && dynamicPricingFlags.dynamicPricingV1;
}

export function isAutonomyOsLearningEnabled(): boolean {
  return autonomyOsLayerFlags.autonomyCoreV1 && autonomyOsLayerFlags.learningLoopV1;
}

export function isAutonomyOsActionsEnabled(): boolean {
  return autonomyOsLayerFlags.autonomyCoreV1 && autonomyOsLayerFlags.autonomyActionsV1;
}

export function isAutonomyOsPortfolioEnabled(): boolean {
  return autonomyOsLayerFlags.autonomyCoreV1 && autonomyOsLayerFlags.portfolioAllocatorV1;
}

export function isAutonomyOsDashboardEnabled(): boolean {
  return autonomyOsLayerFlags.autonomyCoreV1 && autonomyOsLayerFlags.autonomyDashboardV1;
}
