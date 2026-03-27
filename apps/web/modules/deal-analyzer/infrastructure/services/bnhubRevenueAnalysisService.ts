import { VerificationEntityType } from "@prisma/client";
import { prisma } from "@/lib/db";
import { dealAnalyzerConfig } from "@/config/dealAnalyzer";
import { isTrustGraphEnabled } from "@/lib/trustgraph/config";
import {
  BnhubShortTermRecommendation,
  type BnhubDealAnalysisResult,
} from "@/modules/deal-analyzer/domain/bnhub";
import { occupancyForBnhubScenario } from "@/modules/deal-analyzer/infrastructure/services/occupancyAssumptionService";
import { estimateMonthlyShortTermOverheadCents } from "@/modules/deal-analyzer/infrastructure/services/shortTermCostEstimator";
import { ScenarioKind } from "@/modules/deal-analyzer/domain/scenarios";

export async function analyzeBnhubListingRevenue(listingId: string): Promise<BnhubDealAnalysisResult> {
  const listing = await prisma.shortTermListing.findUnique({
    where: { id: listingId },
    select: {
      nightPriceCents: true,
      cleaningFeeCents: true,
      listingVerificationStatus: true,
      verificationStatus: true,
      beds: true,
      baths: true,
      city: true,
    },
  });

  if (!listing) {
    return {
      recommendation: BnhubShortTermRecommendation.INSUFFICIENT,
      confidenceLevel: "low",
      monthlyGrossRevenueCents: null,
      monthlyNetOperatingCents: null,
      nightlyRateCents: null,
      occupancyAssumed: null,
      platformFeePct: dealAnalyzerConfig.bnhub.platformFeePct,
      reasons: ["Short-term listing was not found."],
      warnings: [],
    };
  }

  const reasons: string[] = [];
  const warnings: string[] = [];

  let trustBoost = 0;
  if (isTrustGraphEnabled()) {
    const c = await prisma.verificationCase.findFirst({
      where: { entityType: VerificationEntityType.SHORT_TERM_LISTING, entityId: listingId },
      orderBy: { updatedAt: "desc" },
      select: { trustLevel: true, readinessLevel: true },
    });
    if (c?.trustLevel) {
      const t = String(c.trustLevel).toUpperCase();
      if (t.includes("HIGH") || t.includes("VERIFIED")) trustBoost += 12;
      if (t.includes("LOW")) trustBoost -= 10;
      reasons.push("TrustGraph verification case signals were considered where available.");
    }
  }

  if (String(listing.listingVerificationStatus) === "VERIFIED" || listing.verificationStatus === "VERIFIED") {
    trustBoost += 8;
    reasons.push("Listing verification status contributes positively to the rules-based score.");
  }

  const nightly = listing.nightPriceCents;
  const occ = occupancyForBnhubScenario(ScenarioKind.EXPECTED);
  const occupiedNights = 30 * occ;
  const gross = Math.round(nightly * occupiedNights);
  const platformFee = Math.round(gross * dealAnalyzerConfig.bnhub.platformFeePct);
  const overhead = estimateMonthlyShortTermOverheadCents({
    grossMonthlyRevenueCents: gross,
    cleaningFeeCentsPerEvent: listing.cleaningFeeCents,
  });
  const net = gross - platformFee - overhead.totalCents;

  reasons.push(
    `Occupancy assumed at ${Math.round(occ * 100)}% of nights for illustration — not a booking forecast.`,
  );
  warnings.push("Short-term revenue is highly sensitive to seasonality and local rules — figures are not guaranteed income.");

  let confidence: "low" | "medium" | "high" = "medium";
  if (nightly <= 0 || listing.beds < 1) {
    confidence = "low";
    warnings.push("Weak core listing fields reduce confidence in short-term metrics.");
  }
  if (trustBoost < -5) {
    confidence = "low";
  }
  if (String(listing.listingVerificationStatus) === "VERIFIED" && trustBoost >= 10 && net > 0) {
    confidence = "high";
  }

  let recommendation: (typeof BnhubShortTermRecommendation)[keyof typeof BnhubShortTermRecommendation] =
    BnhubShortTermRecommendation.MODERATE;
  if (confidence === "low" && (gross <= 0 || nightly <= 0)) {
    recommendation = BnhubShortTermRecommendation.INSUFFICIENT;
  } else if (confidence === "low") {
    recommendation = BnhubShortTermRecommendation.CAUTION;
  } else if (net > 0 && confidence === "high" && trustBoost >= 15) {
    recommendation = BnhubShortTermRecommendation.STRONG;
  } else if (net <= 0 || trustBoost < -5) {
    recommendation = BnhubShortTermRecommendation.CAUTION;
  }

  if (recommendation === BnhubShortTermRecommendation.INSUFFICIENT) {
    reasons.push("Insufficient or weak short-term data for a confident classification.");
  }

  return {
    recommendation,
    confidenceLevel: confidence,
    monthlyGrossRevenueCents: gross,
    monthlyNetOperatingCents: net,
    nightlyRateCents: nightly,
    occupancyAssumed: occ,
    platformFeePct: dealAnalyzerConfig.bnhub.platformFeePct,
    reasons,
    warnings,
  };
}
