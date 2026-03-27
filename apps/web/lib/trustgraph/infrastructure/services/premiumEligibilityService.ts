import { prisma } from "@/lib/db";
import type { PremiumEligibilityResult } from "@/lib/trustgraph/domain/premiumPolicy";
import { getPhase6MoatConfig } from "@/lib/trustgraph/config/phase6-moat";
import { isTrustGraphEnabled, isTrustGraphPremiumPlacementEnabled } from "@/lib/trustgraph/feature-flags";

export async function computePremiumEligibilityForListing(listingId: string): Promise<PremiumEligibilityResult> {
  if (!isTrustGraphEnabled() || !isTrustGraphPremiumPlacementEnabled()) {
    return {
      premiumEligible: true,
      eligibilityReasons: ["feature_disabled_defaults_eligible"],
      missingRequirements: [],
      premiumRiskFlags: [],
      displayableUpgradeGuidance: [],
    };
  }

  const cfg = getPhase6MoatConfig().premium;
  const [listing, c] = await Promise.all([
    prisma.fsboListing.findUnique({
      where: { id: listingId },
      select: { propertyType: true, images: true, sellerDeclarationCompletedAt: true },
    }),
    prisma.verificationCase.findFirst({
      where: { entityType: "LISTING", entityId: listingId },
      orderBy: { updatedAt: "desc" },
      select: { overallScore: true, trustLevel: true, readinessLevel: true },
    }),
  ]);

  const eligibilityReasons: string[] = [];
  const missingRequirements: string[] = [];
  const premiumRiskFlags: string[] = [];
  const displayableUpgradeGuidance: string[] = [];

  const scoreOk = (c?.overallScore ?? 0) >= cfg.minTrustScore;
  if (!scoreOk) missingRequirements.push("trust_score");

  const images = listing?.images?.length ?? 0;
  if (images < 3) {
    missingRequirements.push("media_completeness");
    displayableUpgradeGuidance.push("Add more listing photos");
  }

  if (!listing?.sellerDeclarationCompletedAt) {
    missingRequirements.push("declaration");
    displayableUpgradeGuidance.push("Complete seller declaration");
  }

  const critical = c?.readinessLevel === "action_required";
  if (cfg.requireNoCriticalSignals && critical) {
    premiumRiskFlags.push("unresolved_readiness");
    displayableUpgradeGuidance.push("Resolve outstanding verification items");
  }

  const premiumEligible = scoreOk && missingRequirements.length === 0 && !(cfg.requireNoCriticalSignals && critical);

  if (premiumEligible) eligibilityReasons.push("trust_threshold_met");

  return {
    premiumEligible,
    eligibilityReasons,
    missingRequirements,
    premiumRiskFlags,
    displayableUpgradeGuidance,
  };
}
