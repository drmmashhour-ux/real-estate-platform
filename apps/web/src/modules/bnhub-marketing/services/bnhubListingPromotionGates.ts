import {
  BnhubFraudFlagStatus,
  BnhubFraudSeverity,
  BnhubLuxuryEligibilityStatus,
  BnhubLuxuryTierCode,
  BnhubTrustPromotionGateStatus,
  BnhubTrustRiskLevel,
} from "@prisma/client";
import { prisma } from "@/lib/db";
import { isPremiumCampaignStarEligible } from "@/src/modules/bnhub-growth-engine/services/propertyClassificationService";

/**
 * Premium marketing bucket: internal 4★+ and no high/critical unresolved fraud / trust risk.
 */
export async function canLaunchPremiumMarketingCampaign(listingId: string): Promise<{
  allowed: boolean;
  reasons: string[];
}> {
  const reasons: string[] = [];
  const [cls, trust, trustEngine, flags] = await Promise.all([
    prisma.bnhubPropertyClassification.findUnique({ where: { listingId } }),
    prisma.bnhubTrustProfile.findUnique({ where: { listingId } }),
    prisma.bnhubListingTrustRiskProfile.findUnique({
      where: { listingId },
      select: { promotionEligibilityStatus: true },
    }),
    prisma.bnhubFraudFlag.findMany({
      where: {
        listingId,
        status: { in: [BnhubFraudFlagStatus.OPEN, BnhubFraudFlagStatus.UNDER_REVIEW] },
      },
    }),
  ]);
  if (trustEngine?.promotionEligibilityStatus === BnhubTrustPromotionGateStatus.BLOCKED) {
    reasons.push("Listing trust checks block automatic promotional launches — complete validation or contact support.");
  }
  if (trustEngine?.promotionEligibilityStatus === BnhubTrustPromotionGateStatus.REVIEW_REQUIRED) {
    reasons.push("Additional listing validation is required before campaigns can auto-launch.");
  }
  const stars = cls?.starRating ?? 0;
  if (!isPremiumCampaignStarEligible(stars)) {
    reasons.push("Premium campaigns require BNHUB internal estimate of 4★ or higher.");
  }
  if (trust?.overallRiskLevel === BnhubTrustRiskLevel.HIGH || trust?.overallRiskLevel === BnhubTrustRiskLevel.CRITICAL) {
    reasons.push("Elevated trust risk — automatic campaign launch is blocked pending review.");
  }
  const badFraud = flags.some(
    (f) => f.severity === BnhubFraudSeverity.HIGH || f.severity === BnhubFraudSeverity.CRITICAL
  );
  if (badFraud) reasons.push("Unresolved high-severity trust flags — campaigns should not auto-launch.");
  return { allowed: reasons.length === 0, reasons };
}

/**
 * Luxury bucket: Premium or Elite tier signal (internal), not suspended.
 */
export async function canLaunchLuxuryMarketingCampaign(listingId: string): Promise<{
  allowed: boolean;
  reasons: string[];
}> {
  const reasons: string[] = [];
  const tier = await prisma.bnhubLuxuryTier.findUnique({ where: { listingId } });
  if (!tier || (tier.tierCode !== BnhubLuxuryTierCode.PREMIUM && tier.tierCode !== BnhubLuxuryTierCode.ELITE)) {
    reasons.push("Luxury campaign slots require BNHUB Premium or Elite internal tier.");
  }
  if (tier?.eligibilityStatus === BnhubLuxuryEligibilityStatus.SUSPENDED) {
    reasons.push("Luxury tier suspended for this listing.");
  }
  const premium = await canLaunchPremiumMarketingCampaign(listingId);
  if (!premium.allowed) {
    for (const r of premium.reasons) {
      if (!reasons.includes(r)) reasons.push(r);
    }
  }
  return { allowed: reasons.length === 0, reasons };
}
