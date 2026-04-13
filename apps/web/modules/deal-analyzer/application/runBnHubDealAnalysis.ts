import { prisma } from "@/lib/db";
import { isDealAnalyzerBnhubModeEnabled } from "@/modules/deal-analyzer/config";
import { analyzeBnhubListingRevenue } from "@/modules/deal-analyzer/infrastructure/services/bnhubRevenueAnalysisService";
import { logDealAnalyzerPhase2 } from "@/modules/deal-analyzer/infrastructure/services/phase2Logger";

function bnhubInvestmentScore(r: { monthlyNetOperatingCents: number | null; confidenceLevel: string }): number {
  let s = 52;
  if (r.monthlyNetOperatingCents != null && r.monthlyNetOperatingCents > 0) s += 18;
  if (r.confidenceLevel === "high") s += 14;
  else if (r.confidenceLevel === "low") s -= 12;
  return Math.min(100, Math.max(0, s));
}

function bnhubRiskScore(r: { recommendation: string }): number {
  if (r.recommendation === "caution_short_term_candidate") return 72;
  if (r.recommendation === "insufficient_short_term_data") return 78;
  return 44;
}

/**
 * @param attachToListingId — optional FSBO listing id to merge BNHUB overlay into latest Phase 1 analysis summary.
 */
export async function runBnHubDealAnalysis(args: {
  shortTermListingId: string;
  attachToListingId?: string;
}) {
  if (!isDealAnalyzerBnhubModeEnabled()) {
    return { ok: false as const, error: "BNHUB deal analysis mode is disabled" };
  }

  const r = await analyzeBnhubListingRevenue(args.shortTermListingId);

  const sanitized = {
    recommendation: r.recommendation,
    confidenceLevel: r.confidenceLevel,
    monthlyGrossRevenueCents: r.monthlyGrossRevenueCents,
    monthlyNetOperatingCents: r.monthlyNetOperatingCents,
    nightlyRateCents: r.nightlyRateCents,
    occupancyAssumed: r.occupancyAssumed,
    platformFeePct: r.platformFeePct,
    reasons: r.reasons,
    warnings: r.warnings,
  };

  if (args.attachToListingId) {
    const analysis = await prisma.dealAnalysis.findFirst({
      where: { propertyId: args.attachToListingId },
      orderBy: { createdAt: "desc" },
    });
    if (!analysis) {
      return { ok: false as const, error: "No deal analysis found for FSBO listing — run Phase 1 first." };
    }
    const prev =
      analysis.summary && typeof analysis.summary === "object"
        ? (analysis.summary as Record<string, unknown>)
        : {};
    const phase2 = typeof prev.phase2 === "object" && prev.phase2 != null ? { ...(prev.phase2 as object) } : {};

    await prisma.dealAnalysis.update({
      where: { id: analysis.id },
      data: {
        summary: {
          ...prev,
          phase2: {
            ...phase2,
            bnhub: sanitized,
          },
        } as object,
      },
    });

    logDealAnalyzerPhase2("deal_analyzer_bnhub_run", {
      shortTermListingId: args.shortTermListingId,
      attachToListingId: args.attachToListingId,
      analysisId: analysis.id,
      recommendation: r.recommendation,
      trigger: "runBnHubDealAnalysis_overlay",
    });

    return { ok: true as const, analysisId: analysis.id, bnhub: sanitized };
  }

  const investmentScore = bnhubInvestmentScore(r);
  const riskScore = bnhubRiskScore(r);
  const confidenceScore = r.confidenceLevel === "high" ? 82 : r.confidenceLevel === "medium" ? 58 : 34;

  const created = await prisma.dealAnalysis.create({
    data: {
      propertyId: null,
      shortTermListingId: args.shortTermListingId,
      analysisType: "bnhub",
      investmentScore,
      riskScore,
      confidenceScore,
      recommendation: "worth_reviewing",
      opportunityType: "bnhub_candidate",
      summary: {
        phase2: { bnhub: sanitized },
        reasons: ["BNHUB short-term rules-based snapshot (not income guarantee)."],
        warnings: r.warnings,
      } as object,
    },
  });

  logDealAnalyzerPhase2("deal_analyzer_bnhub_run", {
    shortTermListingId: args.shortTermListingId,
    analysisId: created.id,
    recommendation: r.recommendation,
    trigger: "runBnHubDealAnalysis_standalone",
  });

  return { ok: true as const, analysisId: created.id, bnhub: sanitized };
}
