import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { isDealAnalyzerOfferAssistantEnabled } from "@/modules/deal-analyzer/config";
import { buildOfferStrategySnapshot } from "@/modules/deal-analyzer/infrastructure/services/offerStrategyService";
import { logDealAnalyzerPhase3 } from "@/modules/deal-analyzer/infrastructure/services/phase3Logger";
import type { UserStrategyMode } from "@/modules/deal-analyzer/domain/strategyModes";
import { getLatestDealAnalysisRecord } from "@/modules/deal-analyzer/application/getDealAnalysis";

export async function runOfferStrategy(args: {
  listingId: string;
  strategyMode?: UserStrategyMode | null;
}) {
  if (!isDealAnalyzerOfferAssistantEnabled()) {
    return { ok: false as const, error: "Offer assistant is disabled" };
  }

  const listing = await prisma.fsboListing.findUnique({
    where: { id: args.listingId },
    select: { priceCents: true, trustScore: true },
  });
  if (!listing) return { ok: false as const, error: "Listing not found" };

  const analysis = await getLatestDealAnalysisRecord(args.listingId);
  if (!analysis) {
    return { ok: false as const, error: "Run deal analysis first (Phase 1)." };
  }

  const summary =
    analysis.summary && typeof analysis.summary === "object" ? (analysis.summary as Record<string, unknown>) : {};
  const phase2 =
    typeof summary.phase2 === "object" && summary.phase2 != null ? (summary.phase2 as Record<string, unknown>) : {};
  const comp = phase2.comparablesSummary as { positioningOutcome?: string; confidenceLevel?: string } | undefined;
  const phase3prev =
    typeof summary.phase3 === "object" && summary.phase3 != null ? (summary.phase3 as Record<string, unknown>) : {};

  const strategyMode = args.strategyMode ?? (phase3prev.strategyMode as UserStrategyMode | undefined) ?? null;

  const snap = buildOfferStrategySnapshot({
    askCents: listing.priceCents,
    trustScore: listing.trustScore,
    riskScore: analysis.riskScore,
    positioningOutcome: comp?.positioningOutcome ?? null,
    comparablesSummaryConfidence: comp?.confidenceLevel,
    strategyMode,
  });

  const row = await prisma.dealOfferStrategy.create({
    data: {
      propertyId: args.listingId,
      analysisId: analysis.id,
      suggestedMinOfferCents: snap.suggestedMinOfferCents,
      suggestedTargetOfferCents: snap.suggestedTargetOfferCents,
      suggestedMaxOfferCents: snap.suggestedMaxOfferCents,
      confidenceLevel: snap.confidenceLevel,
      competitionSignal: snap.competitionSignal,
      riskLevel: snap.riskLevel,
      offerBand: snap.offerBand,
      offerPosture: snap.offerPosture,
      recommendedConditions: snap.recommendedConditions as Prisma.InputJsonValue,
      warnings: snap.warnings as Prisma.InputJsonValue,
      explanation: snap.explanation,
    },
  });

  await prisma.dealAnalysis.update({
    where: { id: analysis.id },
    data: {
      summary: {
        ...summary,
        phase3: {
          ...phase3prev,
          strategyMode: strategyMode ?? phase3prev.strategyMode,
          lastOfferStrategyAt: new Date().toISOString(),
        },
      } as object,
    },
  });

  logDealAnalyzerPhase3("deal_analyzer_offer_strategy", {
    propertyId: args.listingId,
    confidence: snap.confidenceLevel,
    posture: snap.offerPosture,
    trigger: "runOfferStrategy",
  });

  return { ok: true as const, id: row.id, snapshot: snap };
}
