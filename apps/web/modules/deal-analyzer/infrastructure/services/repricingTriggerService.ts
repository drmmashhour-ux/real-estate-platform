import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { dealAnalyzerConfig } from "@/config/dealAnalyzer";
import { PricePositioningOutcome } from "@/modules/deal-analyzer/domain/comparables";
import { RepricingTriggerType } from "@/modules/deal-analyzer/domain/repricing";

async function createTriggerIfOpen(args: {
  propertyId: string;
  triggerType: string;
  severity: "info" | "warning";
  metadata?: Record<string, unknown>;
}): Promise<boolean> {
  const existing = await prisma.sellerRepricingTrigger.findFirst({
    where: { propertyId: args.propertyId, triggerType: args.triggerType, status: "open" },
  });
  if (existing) return false;
  await prisma.sellerRepricingTrigger.create({
    data: {
      propertyId: args.propertyId,
      triggerType: args.triggerType,
      severity: args.severity,
      status: "open",
      metadata: args.metadata != null ? (args.metadata as Prisma.InputJsonValue) : undefined,
    },
  });
  return true;
}

export async function evaluateRepricingTriggersForListing(listingId: string): Promise<{ created: number }> {
  const listing = await prisma.fsboListing.findUnique({
    where: { id: listingId },
    include: { documents: { select: { docType: true, fileUrl: true } } },
  });
  if (!listing) return { created: 0 };

  const analysis = await prisma.dealAnalysis.findFirst({
    where: { propertyId: listingId },
    orderBy: { createdAt: "desc" },
  });
  const summary =
    analysis?.summary && typeof analysis.summary === "object" ? (analysis.summary as Record<string, unknown>) : {};
  const phase2 =
    typeof summary.phase2 === "object" && summary.phase2 != null ? (summary.phase2 as Record<string, unknown>) : {};
  const comp = phase2.comparablesSummary as {
    positioningOutcome?: string;
    confidenceLevel?: string;
  } | undefined;

  const pricing = await prisma.sellerPricingAdvice.findUnique({ where: { propertyId: listingId } });

  let created = 0;
  const staleDays = dealAnalyzerConfig.phase4.repricing.staleDays;
  const daysSince = (Date.now() - listing.updatedAt.getTime()) / (1000 * 60 * 60 * 24);

  if (comp?.positioningOutcome === PricePositioningOutcome.ABOVE_COMPARABLE_RANGE) {
    if (await createTriggerIfOpen({
      propertyId: listingId,
      triggerType: RepricingTriggerType.MOVED_ABOVE_COMPARABLE_RANGE,
      severity: "warning",
    })) {
      created += 1;
    }
  }

  if (daysSince >= staleDays && comp?.positioningOutcome === PricePositioningOutcome.ABOVE_COMPARABLE_RANGE) {
    if (await createTriggerIfOpen({
      propertyId: listingId,
      triggerType: RepricingTriggerType.STALE_WEAK_POSITION,
      severity: "warning",
      metadata: { daysSince: Math.floor(daysSince) },
    })) {
      created += 1;
    }
  }

  const pos = pricing?.pricePosition ?? "";
  if ((listing.trustScore ?? 0) >= 55 && (pos.includes("high") || pos.includes("meaningfully"))) {
    if (await createTriggerIfOpen({
      propertyId: listingId,
      triggerType: RepricingTriggerType.TRUST_IMPROVED_PRICE_STILL_HIGH,
      severity: "info",
      metadata: { trustScore: listing.trustScore },
    })) {
      created += 1;
    }
  }

  const docRatio =
    listing.documents.filter((d) => Boolean(d.fileUrl?.trim())).length / Math.max(1, listing.documents.length);
  if (docRatio >= 0.85 && comp?.positioningOutcome === PricePositioningOutcome.ABOVE_COMPARABLE_RANGE) {
    if (await createTriggerIfOpen({
      propertyId: listingId,
      triggerType: RepricingTriggerType.DOCS_COMPLETED_REVIEW_PRICE,
      severity: "info",
      metadata: { docRatio },
    })) {
      created += 1;
    }
  }

  return { created };
}

export async function dismissRepricingTrigger(triggerId: string, ownerId: string) {
  const row = await prisma.sellerRepricingTrigger.findFirst({
    where: { id: triggerId },
    include: { listing: { select: { ownerId: true } } },
  });
  if (!row || row.listing.ownerId !== ownerId) return null;
  return prisma.sellerRepricingTrigger.update({
    where: { id: triggerId },
    data: { status: "dismissed" },
  });
}
