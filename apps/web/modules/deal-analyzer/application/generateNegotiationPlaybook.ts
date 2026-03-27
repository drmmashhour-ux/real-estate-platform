import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { isDealAnalyzerNegotiationPlaybooksEnabled } from "@/modules/deal-analyzer/config";
import { classifyMarketCondition } from "@/modules/deal-analyzer/infrastructure/services/marketConditionClassifier";
import { buildNegotiationPlaybook } from "@/modules/deal-analyzer/infrastructure/services/negotiationPlaybookService";
import { adjustPostureForMarketCondition } from "@/modules/deal-analyzer/infrastructure/services/offerPostureAdjustmentService";
import { logDealAnalyzerPhase4 } from "@/modules/deal-analyzer/infrastructure/services/phase4Logger";

export async function generateNegotiationPlaybook(listingId: string) {
  if (!isDealAnalyzerNegotiationPlaybooksEnabled()) {
    return { ok: false as const, error: "Negotiation playbooks disabled" };
  }

  const listing = await prisma.fsboListing.findUnique({
    where: { id: listingId },
    select: { trustScore: true, updatedAt: true, createdAt: true },
  });
  const analysis = await prisma.dealAnalysis.findFirst({
    where: { propertyId: listingId },
    orderBy: { createdAt: "desc" },
  });
  if (!listing || !analysis) return { ok: false as const, error: "Missing listing or analysis" };

  const summary =
    analysis.summary && typeof analysis.summary === "object" ? (analysis.summary as Record<string, unknown>) : {};
  const phase2 =
    typeof summary.phase2 === "object" && summary.phase2 != null ? (summary.phase2 as Record<string, unknown>) : {};
  const comp = phase2.comparablesSummary as {
    positioningOutcome?: string;
    confidenceLevel?: string;
    comparableCount?: number;
  } | undefined;

  const listingAgeDays = Math.floor(
    (Date.now() - listing.updatedAt.getTime()) / (1000 * 60 * 60 * 24),
  );

  const marketCondition = classifyMarketCondition({
    positioningOutcome: comp?.positioningOutcome ?? null,
    confidenceLevel: comp?.confidenceLevel ?? null,
    comparableCount: comp?.comparableCount ?? 0,
    listingAgeDays,
  });

  const offerRow = await prisma.dealOfferStrategy.findFirst({
    where: { propertyId: listingId },
    orderBy: { updatedAt: "desc" },
  });

  const basePosture = offerRow?.offerPosture ?? "balanced";
  const posture = adjustPostureForMarketCondition(basePosture, marketCondition, listing.trustScore);

  const built = buildNegotiationPlaybook({
    marketCondition,
    posture,
    trustScore: listing.trustScore,
  });

  const row = await prisma.dealNegotiationPlaybook.create({
    data: {
      propertyId: listingId,
      analysisId: analysis.id,
      offerStrategyId: offerRow?.id ?? null,
      marketCondition,
      posture,
      playbookSteps: built.steps as unknown as Prisma.InputJsonValue,
      warnings: built.warnings as Prisma.InputJsonValue,
      confidenceLevel: built.confidenceLevel,
    },
  });

  logDealAnalyzerPhase4("negotiation_playbook_generated", {
    propertyId: listingId,
    marketCondition,
    confidence: built.confidenceLevel,
  });

  return { ok: true as const, id: row.id, playbook: built, marketCondition, posture };
}
