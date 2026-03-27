import { getPhase8PlatformConfig } from "@/lib/trustgraph/config/phase8-platform";
import type { PremiumEligibilityResult } from "@/lib/trustgraph/domain/premiumPolicy";
import { computePremiumEligibilityForListing } from "@/lib/trustgraph/infrastructure/services/premiumEligibilityService";
import {
  getWorkspaceIdForListingEntity,
  subscriptionAllowsPremiumPlacement,
} from "@/lib/trustgraph/infrastructure/services/subscriptionPolicyService";
import { isTrustGraphBillingEnabled } from "@/lib/trustgraph/feature-flags";

/** Policy facade — extend with plan / billing gating without replacing callers. Core safety rules unchanged. */
export async function evaluatePremiumPlacementPolicy(listingId: string): Promise<PremiumEligibilityResult> {
  const base = await computePremiumEligibilityForListing(listingId);
  if (!isTrustGraphBillingEnabled()) return base;

  const workspaceId = await getWorkspaceIdForListingEntity(listingId);
  if (!workspaceId) return base;

  const allowed = await subscriptionAllowsPremiumPlacement(workspaceId);
  if (allowed) return base;

  const labels = getPhase8PlatformConfig().safeLabels;
  return {
    ...base,
    premiumEligible: false,
    eligibilityReasons: [...base.eligibilityReasons, "subscription_plan"],
    missingRequirements: [...base.missingRequirements, "enterprise_subscription"],
    displayableUpgradeGuidance: [...base.displayableUpgradeGuidance, labels.subscriptionRequired],
  };
}
