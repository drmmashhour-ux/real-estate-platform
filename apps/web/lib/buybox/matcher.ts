import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { alertOnNewHighBuyBoxMatches } from "@/lib/buybox/alerts";
import {
  assertBuyBoxDataLayerEnabled,
  assertBuyBoxDealMetricsPresent,
} from "@/lib/buybox/safety";
import { computeBuyBoxMatchScore, dealViewFromFsbo, type BuyBoxDealView } from "@/lib/buybox/scoring";

export async function runBuyBoxMatch(buyBoxId: string, ownerType: string, ownerId: string) {
  assertBuyBoxDataLayerEnabled();

  const buyBox = await prisma.investorBuyBox.findFirst({
    where: { id: buyBoxId, ownerType, ownerId, active: true },
  });

  if (!buyBox) throw new Error("BUY_BOX_NOT_FOUND");

  const where: Prisma.FsboListingWhereInput = {
    status: "ACTIVE",
    moderationStatus: "APPROVED",
  };

  if (buyBox.city?.trim()) {
    where.city = { equals: buyBox.city.trim(), mode: "insensitive" };
  }
  if (buyBox.propertyType?.trim()) {
    where.propertyType = buyBox.propertyType.trim();
  }
  if (buyBox.minPriceCents != null || buyBox.maxPriceCents != null) {
    where.priceCents = {};
    if (buyBox.minPriceCents != null) where.priceCents.gte = buyBox.minPriceCents;
    if (buyBox.maxPriceCents != null) where.priceCents.lte = buyBox.maxPriceCents;
  }
  if (buyBox.minBedrooms != null) {
    where.bedrooms = { gte: buyBox.minBedrooms };
  }
  if (buyBox.minBathrooms != null) {
    where.bathrooms = { gte: Math.ceil(buyBox.minBathrooms) };
  }
  if (buyBox.minAreaSqft != null || buyBox.maxAreaSqft != null) {
    where.surfaceSqft = {};
    if (buyBox.minAreaSqft != null) where.surfaceSqft.gte = Math.round(buyBox.minAreaSqft);
    if (buyBox.maxAreaSqft != null) where.surfaceSqft.lte = Math.round(buyBox.maxAreaSqft);
  }

  const listings = await prisma.fsboListing.findMany({
    where,
    include: { metrics: true },
    orderBy: { createdAt: "desc" },
    take: 300,
  });

  for (const listing of listings) {
    const deal: BuyBoxDealView = dealViewFromFsbo(listing, listing.metrics);
    assertBuyBoxDealMetricsPresent({
      askingPriceCents: deal.askingPriceCents,
      listingId: deal.listingId,
    });

    const result = computeBuyBoxMatchScore({ buyBox, deal });

    if (result.matchScore < 40) {
      await prisma.buyBoxMatch.deleteMany({
        where: { investorBuyBoxId: buyBox.id, listingId: listing.id },
      });
      continue;
    }

    await prisma.buyBoxMatch.upsert({
      where: {
        investorBuyBoxId_listingId: {
          investorBuyBoxId: buyBox.id,
          listingId: listing.id,
        },
      },
      create: {
        investorBuyBoxId: buyBox.id,
        listingId: listing.id,
        dealCandidateId: null,
        matchScore: result.matchScore,
        matchLabel: result.matchLabel,
        rationale: {
          reasons: result.reasons,
          strategyType: buyBox.strategyType ?? null,
          listingTitle: listing.title,
          dataQuality: listing.metrics ? "metrics_present" : "metrics_missing",
        } as Prisma.InputJsonValue,
      },
      update: {
        matchScore: result.matchScore,
        matchLabel: result.matchLabel,
        rationale: {
          reasons: result.reasons,
          strategyType: buyBox.strategyType ?? null,
          listingTitle: listing.title,
          dataQuality: listing.metrics ? "metrics_present" : "metrics_missing",
        } as Prisma.InputJsonValue,
      },
    });
  }

  await alertOnNewHighBuyBoxMatches(buyBox.id);

  return prisma.buyBoxMatch.findMany({
    where: { investorBuyBoxId: buyBox.id },
    orderBy: { matchScore: "desc" },
    take: 100,
  });
}
