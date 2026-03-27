import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { FSBO_HUB_REQUIRED_DOC_TYPES } from "@/lib/fsbo/seller-hub-doc-types";
import { isDealAnalyzerPricingAdvisorEnabled } from "@/modules/deal-analyzer/config";
import { buildSellerPricingAdvice } from "@/modules/deal-analyzer/infrastructure/services/sellerPricingAdvisorService";
import { logDealAnalyzerPhase3 } from "@/modules/deal-analyzer/infrastructure/services/phase3Logger";
import { getLatestDealAnalysisRecord } from "@/modules/deal-analyzer/application/getDealAnalysis";

function docRatio(docs: { docType: string; fileUrl: string | null }[]): number {
  const ok = FSBO_HUB_REQUIRED_DOC_TYPES.filter((t) => {
    const row = docs.find((d) => d.docType === t);
    return Boolean(row?.fileUrl?.trim());
  }).length;
  return ok / Math.max(1, FSBO_HUB_REQUIRED_DOC_TYPES.length);
}

export async function runSellerPricingAdvisor(args: { listingId: string }) {
  if (!isDealAnalyzerPricingAdvisorEnabled()) {
    return { ok: false as const, error: "Seller pricing advisor is disabled" };
  }

  const listing = await prisma.fsboListing.findUnique({
    where: { id: args.listingId },
    include: { documents: { select: { docType: true, fileUrl: true } } },
  });
  if (!listing) return { ok: false as const, error: "Listing not found" };

  const analysis = await getLatestDealAnalysisRecord(args.listingId);
  const summary =
    analysis?.summary && typeof analysis.summary === "object" ? (analysis.summary as Record<string, unknown>) : {};
  const phase2 =
    typeof summary.phase2 === "object" && summary.phase2 != null ? (summary.phase2 as Record<string, unknown>) : {};
  const comp = phase2.comparablesSummary as {
    positioningOutcome?: string;
    confidenceLevel?: string;
    medianPriceCents?: number | null;
  } | undefined;

  const advice = buildSellerPricingAdvice({
    positioningOutcome: comp?.positioningOutcome ?? null,
    compConfidence: comp?.confidenceLevel,
    trustScore: listing.trustScore,
    documentCompleteness: docRatio(listing.documents),
    askCents: listing.priceCents,
    medianPriceCents: comp?.medianPriceCents ?? null,
  });

  const row = await prisma.sellerPricingAdvice.upsert({
    where: { propertyId: args.listingId },
    create: {
      propertyId: args.listingId,
      pricePosition: advice.pricePosition,
      confidenceLevel: advice.confidenceLevel,
      suggestedAction: advice.suggestedAction,
      reasons: advice.reasons as Prisma.InputJsonValue,
      improvementActions: advice.improvementActions as Prisma.InputJsonValue,
      explanation: advice.explanation,
    },
    update: {
      pricePosition: advice.pricePosition,
      confidenceLevel: advice.confidenceLevel,
      suggestedAction: advice.suggestedAction,
      reasons: advice.reasons as Prisma.InputJsonValue,
      improvementActions: advice.improvementActions as Prisma.InputJsonValue,
      explanation: advice.explanation,
    },
  });

  logDealAnalyzerPhase3("deal_analyzer_pricing_advisor", {
    propertyId: args.listingId,
    position: advice.pricePosition,
    confidence: advice.confidenceLevel,
    trigger: "runSellerPricingAdvisor",
  });

  return { ok: true as const, id: row.id, advice };
}
