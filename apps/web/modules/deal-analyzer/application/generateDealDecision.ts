import { prisma } from "@/lib/db";
import { isDealAnalyzerEnabled } from "@/modules/deal-analyzer/config";
import { refineDealDecision } from "@/modules/deal-analyzer/infrastructure/services/decisionRefinementService";
import { buildPhase2DecisionReasons } from "@/modules/deal-analyzer/infrastructure/services/dealReasonBuilder";
import { logDealAnalyzerPhase2 } from "@/modules/deal-analyzer/infrastructure/services/phase2Logger";

export async function generateDealDecision(args: { listingId: string; analysisId?: string }) {
  if (!isDealAnalyzerEnabled()) {
    return { ok: false as const, error: "Deal Analyzer is disabled" };
  }

  const analysis =
    args.analysisId != null
      ? await prisma.dealAnalysis.findUnique({ where: { id: args.analysisId } })
      : await prisma.dealAnalysis.findFirst({
          where: { propertyId: args.listingId },
          orderBy: { createdAt: "desc" },
        });

  if (!analysis?.id || !analysis.propertyId) {
    return { ok: false as const, error: "No FSBO deal analysis found for this listing." };
  }

  const summary =
    analysis.summary && typeof analysis.summary === "object" ? (analysis.summary as Record<string, unknown>) : {};
  const components =
    typeof summary.components === "object" && summary.components != null
      ? (summary.components as { trustComponent?: number })
      : null;
  const phase2 = typeof summary.phase2 === "object" && summary.phase2 != null ? (summary.phase2 as Record<string, unknown>) : {};
  const comp = phase2.comparablesSummary as { outcome?: string; positioningOutcome?: string } | undefined;
  const positioningOutcome = comp?.positioningOutcome ?? comp?.outcome ?? null;
  const scen = phase2.scenarioSummary as { confidence?: string } | undefined;
  const bn = phase2.bnhub as { recommendation?: string } | undefined;

  const scenarioConfidence =
    scen?.confidence === "high" || scen?.confidence === "medium" || scen?.confidence === "low"
      ? (scen.confidence as "low" | "medium" | "high")
      : null;

  const bnRec = bn?.recommendation;
  const bnhubCandidate =
    bnRec != null &&
    bnRec !== "insufficient_short_term_data" &&
    (bnRec === "strong_short_term_candidate" || bnRec === "moderate_short_term_candidate");

  const refined = refineDealDecision({
    trustComponent: components?.trustComponent ?? null,
    riskScore: analysis.riskScore,
    confidenceScore: analysis.confidenceScore,
    positioningOutcome,
    phase1Recommendation: analysis.recommendation,
    phase1Opportunity: analysis.opportunityType,
    bnhubCandidate,
  });

  const reasons = buildPhase2DecisionReasons({
    phase1Recommendation: analysis.recommendation,
    phase1Opportunity: analysis.opportunityType,
    trustComponent: components?.trustComponent ?? null,
    riskScore: analysis.riskScore,
    confidenceScore: analysis.confidenceScore,
    positioningOutcome,
    scenarioConfidence,
    bnhubRecommendation: bn?.recommendation ?? null,
  });

  const warnings: string[] = [];
  if (positioningOutcome === "insufficient_comparable_data") {
    warnings.push("Comparable data is thin — treat refined labels as guidance, not certainty.");
  }
  if (scenarioConfidence === "low") {
    warnings.push("Scenario confidence is low — cash-flow overlays are illustrative.");
  }

  await prisma.dealAnalysis.update({
    where: { id: analysis.id },
    data: {
      summary: {
        ...summary,
        phase2: {
          ...phase2,
          decisionRefinement: {
            recommendation: refined.recommendation,
            opportunity: refined.opportunity,
            reasons,
            warnings,
          },
        },
      } as object,
    },
  });

  logDealAnalyzerPhase2("deal_analyzer_decision_refine", {
    listingId: args.listingId,
    analysisId: analysis.id,
    refinedRecommendation: refined.recommendation,
    trigger: "generateDealDecision",
  });

  return { ok: true as const, analysisId: analysis.id, decision: refined, reasons, warnings };
}
