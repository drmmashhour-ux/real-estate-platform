import { prisma } from "@/lib/db";
import { DEAL_ANALYZER_DISCLAIMER } from "@/modules/deal-analyzer/domain/contracts";
import type {
  ComparablesBlockDto,
  DealAnalysisPublicDto,
  DealDecisionDto,
  BnhubDealSummaryDto,
} from "@/modules/deal-analyzer/domain/contracts";
import { refineDealAnalysisConfidence } from "@/modules/deal-analyzer/domain/confidenceAdjustments";
import { riskLevelPublic } from "@/modules/deal-analyzer/domain/scoring";
import {
  isDealAnalyzerBnhubModeEnabled,
  isDealAnalyzerCompsEnabled,
  isDealAnalyzerEnabled,
  isDealAnalyzerScenariosEnabled,
} from "@/modules/deal-analyzer/config";
import { mapComparableRow, mapScenarioRow } from "@/modules/deal-analyzer/infrastructure/mappers/phase2DtoMappers";

function mapConfidence(n: number | null | undefined): "low" | "medium" | "high" {
  if (n == null) return "low";
  if (n >= 75) return "high";
  if (n >= 50) return "medium";
  return "low";
}

export async function getLatestDealAnalysisRecord(listingId: string) {
  return prisma.dealAnalysis.findFirst({
    where: { propertyId: listingId },
    orderBy: { createdAt: "desc" },
    include: {
      scenarios: { orderBy: { createdAt: "asc" } },
      comparables: { orderBy: { similarityScore: "desc" }, take: 24 },
    },
  });
}

export async function getDealAnalysisPublicDto(listingId: string): Promise<DealAnalysisPublicDto | null> {
  if (!isDealAnalyzerEnabled()) return null;
  const row = await getLatestDealAnalysisRecord(listingId);
  if (!row) return null;

  const summary = row.summary && typeof row.summary === "object" ? (row.summary as Record<string, unknown>) : {};
  const reasons = Array.isArray(summary.reasons) ? summary.reasons.filter((x): x is string => typeof x === "string") : [];
  const warnings = Array.isArray(summary.warnings) ? summary.warnings.filter((x): x is string => typeof x === "string") : [];

  const expected =
    row.scenarios.find((s) => s.scenarioType === "expected") ?? row.scenarios[0] ?? null;
  const scenarioPreview = expected
    ? {
        scenarioType: expected.scenarioType,
        monthlyRent: expected.monthlyRent,
        occupancyRate: expected.occupancyRate != null ? Number(expected.occupancyRate) : null,
        monthlyCashFlow: expected.monthlyCashFlow,
        annualRoiPercent: expected.annualRoi != null ? Number(expected.annualRoi) : null,
        capRatePercent: expected.capRate != null ? Number(expected.capRate) : null,
        note: "Scenario values are illustrative where present — see disclaimer.",
      }
    : null;

  const phase2FromSummary =
    typeof summary.phase2 === "object" && summary.phase2 != null ? (summary.phase2 as Record<string, unknown>) : {};

  let phase2: DealAnalysisPublicDto["phase2"];

  if (isDealAnalyzerCompsEnabled() || isDealAnalyzerScenariosEnabled() || isDealAnalyzerBnhubModeEnabled()) {
    const compSummary = phase2FromSummary.comparablesSummary as ComparablesBlockDto["summary"] | undefined;
    const next: NonNullable<DealAnalysisPublicDto["phase2"]> = {};

    if (isDealAnalyzerCompsEnabled() && (row.comparables.length > 0 || compSummary)) {
      next.comparables = {
        summary: compSummary ?? {
          positioningOutcome: null,
          confidenceLevel: null,
          comparableCount: row.comparables.length,
          medianPriceCents: null,
          priceRangeCents: null,
          reasons: [],
          warnings: [],
        },
        items: row.comparables.map(mapComparableRow),
      };
    }

    if (isDealAnalyzerScenariosEnabled() && row.scenarios.length > 0) {
      next.scenarios = row.scenarios.map(mapScenarioRow);
    }

    const dec = phase2FromSummary.decisionRefinement as DealDecisionDto | undefined;
    if (dec?.recommendation && dec?.opportunity) {
      next.decision = {
        recommendation: dec.recommendation,
        opportunity: dec.opportunity,
        reasons: Array.isArray(dec.reasons) ? dec.reasons.filter((x): x is string => typeof x === "string") : [],
        warnings: Array.isArray(dec.warnings) ? dec.warnings.filter((x): x is string => typeof x === "string") : [],
      };
    }

    const bn = phase2FromSummary.bnhub as BnhubDealSummaryDto | undefined;
    if (isDealAnalyzerBnhubModeEnabled() && bn?.recommendation) {
      next.bnhub = {
        recommendation: bn.recommendation,
        confidenceLevel: bn.confidenceLevel ?? "low",
        monthlyGrossRevenueCents: bn.monthlyGrossRevenueCents ?? null,
        monthlyNetOperatingCents: bn.monthlyNetOperatingCents ?? null,
        nightlyRateCents: bn.nightlyRateCents ?? null,
        occupancyAssumed: bn.occupancyAssumed ?? null,
        platformFeePct: bn.platformFeePct ?? 0,
        reasons: Array.isArray(bn.reasons) ? bn.reasons : [],
        warnings: Array.isArray(bn.warnings) ? bn.warnings : [],
      };
    }

    phase2 = Object.keys(next).length > 0 ? next : undefined;
  }

  const compSummaryForRefine =
    phase2?.comparables?.summary ??
    (phase2FromSummary.comparablesSummary as ComparablesBlockDto["summary"] | undefined);

  const refined = refineDealAnalysisConfidence({
    baseLevel: mapConfidence(row.confidenceScore),
    investmentScore: row.investmentScore,
    riskScore: row.riskScore,
    opportunityType: row.opportunityType,
    comparablesConfidence: compSummaryForRefine?.confidenceLevel,
    comparableCount: row.comparables.length,
    analysisUpdatedAt: row.updatedAt,
    scenarioModes: row.scenarios.map((s) => s.scenarioMode),
  });

  const mergedReasons = [...reasons, ...refined.strategyNotes];
  const mergedWarnings = [...warnings, ...refined.extraWarnings];

  return {
    analysisId: row.id,
    investmentScore: row.investmentScore,
    riskScore: row.riskScore,
    opportunityType: row.opportunityType,
    recommendation: row.recommendation,
    confidenceLevel: refined.confidenceLevel,
    reasons: mergedReasons,
    warnings: mergedWarnings,
    riskLevel: riskLevelPublic(row.riskScore),
    scenarioPreview,
    disclaimer: DEAL_ANALYZER_DISCLAIMER,
    phase2,
  };
}
