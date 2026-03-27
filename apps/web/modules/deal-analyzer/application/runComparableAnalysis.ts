import { prisma } from "@/lib/db";
import { ComparableSourceType } from "@/modules/deal-analyzer/domain/comparables";
import { isDealAnalyzerCompsEnabled } from "@/modules/deal-analyzer/config";
import type { ComparableSearchOverrides } from "@/modules/deal-analyzer/infrastructure/services/comparablePropertyService";
import {
  findComparableFsboListings,
  rankComparablesBySimilarity,
  toComparableWithScores,
} from "@/modules/deal-analyzer/infrastructure/services/comparablePropertyService";
import { computePricePositioning } from "@/modules/deal-analyzer/infrastructure/services/pricePositioningService";
import { logDealAnalyzerPhase2 } from "@/modules/deal-analyzer/infrastructure/services/phase2Logger";

export async function runComparableAnalysis(args: {
  listingId: string;
  analysisId?: string;
  comparableSearchOverrides?: ComparableSearchOverrides | null;
  positioningOverrides?: { minGoodComps?: number; minCompsForMediumConfidence?: number } | null;
  phase4Meta?: { regionalProfileKey?: string; refreshTrigger?: string } | null;
}) {
  if (!isDealAnalyzerCompsEnabled()) {
    return { ok: false as const, error: "Comparable analysis is disabled" };
  }

  const analysis =
    args.analysisId != null
      ? await prisma.dealAnalysis.findUnique({ where: { id: args.analysisId } })
      : await prisma.dealAnalysis.findFirst({
          where: { propertyId: args.listingId },
          orderBy: { createdAt: "desc" },
        });

  if (!analysis?.id) {
    return { ok: false as const, error: "No deal analysis found — run Phase 1 first." };
  }

  const { subject, comparables } = await findComparableFsboListings(
    args.listingId,
    args.comparableSearchOverrides ?? undefined,
  );
  if (!subject) {
    return { ok: false as const, error: "Listing not found" };
  }

  const ranked = rankComparablesBySimilarity(subject, comparables);
  const withScores = toComparableWithScores(ranked);
  const positioning = computePricePositioning({
    subjectPriceCents: subject.priceCents,
    comparables: withScores,
    overrides: args.positioningOverrides ?? undefined,
  });

  await prisma.$transaction(async (tx) => {
    await tx.dealAnalysisComparable.deleteMany({ where: { analysisId: analysis.id } });

    const top = withScores.slice(0, 24);
    for (const c of top) {
      await tx.dealAnalysisComparable.create({
        data: {
          analysisId: analysis.id,
          comparablePropertyId: c.id,
          distanceKm: c.distanceKm,
          similarityScore: c.similarityScore,
          sourceType: ComparableSourceType.FSBO,
          priceCents: c.priceCents,
          pricePerSqft: c.pricePerSqft,
          propertyType: c.propertyType,
          bedrooms: c.bedrooms,
          bathrooms: c.bathrooms,
          areaSqft: c.areaSqft,
          listingStatus: c.listingStatus,
          details: { rank: "top_pool" },
        },
      });
    }

    const prev =
      analysis.summary && typeof analysis.summary === "object"
        ? (analysis.summary as Record<string, unknown>)
        : {};
    const phase2 = typeof prev.phase2 === "object" && prev.phase2 != null ? { ...(prev.phase2 as object) } : {};
    const phase4prev =
      typeof prev.phase4 === "object" && prev.phase4 != null ? { ...(prev.phase4 as Record<string, unknown>) } : {};
    const phase4 = {
      ...phase4prev,
      lastComparableRefreshAt: new Date().toISOString(),
      ...(args.phase4Meta?.regionalProfileKey != null
        ? { regionalProfileKey: args.phase4Meta.regionalProfileKey }
        : {}),
      ...(args.phase4Meta?.refreshTrigger != null ? { lastRefreshTrigger: args.phase4Meta.refreshTrigger } : {}),
    };

    await tx.dealAnalysis.update({
      where: { id: analysis.id },
      data: {
        summary: {
          ...prev,
          phase4,
          phase2: {
            ...phase2,
            comparablesSummary: {
              positioningOutcome: positioning.outcome,
              outcome: positioning.outcome,
              confidenceLevel: positioning.confidenceLevel,
              comparableCount: positioning.comparableCount,
              priceRangeCents: positioning.priceRangeCents,
              medianPriceCents: positioning.medianPriceCents,
              reasons: positioning.reasons,
              warnings: positioning.warnings,
            },
          },
        } as object,
      },
    });
  });

  logDealAnalyzerPhase2("deal_analyzer_comparable_run", {
    listingId: args.listingId,
    analysisId: analysis.id,
    comparableCount: String(positioning.comparableCount),
    outcome: positioning.outcome,
    confidence: positioning.confidenceLevel,
    trigger: "runComparableAnalysis",
  });

  return { ok: true as const, analysisId: analysis.id, positioning };
}
