/**
 * Investment opportunity scoring – per property in a region using price/rent/BNHUB/demand signals.
 */

import { prisma } from "@/lib/db";
import type { RiskLevel } from "./types";

export async function computeInvestmentScoreForProperty(
  propertyIdentityId: string,
  marketRegionId: string
): Promise<{ investmentScore: number; riskLevel: RiskLevel; summary: string }> {
  const [priceRow, rentRow, bnhubRow, demandRow] = await Promise.all([
    prisma.marketPriceIndex.findFirst({
      where: { marketRegionId },
      orderBy: { period: "desc" },
    }),
    prisma.marketRentIndex.findFirst({
      where: { marketRegionId },
      orderBy: { period: "desc" },
    }),
    prisma.marketBnhubIndex.findFirst({
      where: { marketRegionId },
      orderBy: { period: "desc" },
    }),
    prisma.marketDemandMetrics.findFirst({
      where: { marketRegionId },
      orderBy: { period: "desc" },
    }),
  ]);

  let score = 50;
  const factors: string[] = [];

  if (priceRow?.trendDirection === "up") {
    score += 10;
    factors.push("rising sale prices");
  } else if (priceRow?.trendDirection === "down") score -= 10;

  if (rentRow?.averageRent && rentRow.averageRent > 0) {
    factors.push("rent data available");
    score += 5;
  }
  if (bnhubRow?.averageOccupancy != null && bnhubRow.averageOccupancy > 0.5) {
    score += 10;
    factors.push("strong STR occupancy");
  }
  if (bnhubRow?.averageMonthlyRevenue && bnhubRow.averageMonthlyRevenue > 0) {
    factors.push("STR revenue potential");
    score += 5;
  }
  if (demandRow?.demandScore != null && demandRow.demandScore > 50) {
    score += 10;
    factors.push("high demand");
  }
  if (demandRow?.inventoryLevel != null && demandRow.inventoryLevel < 100 && (demandRow.bookingVolume ?? 0) > 0) {
    score += 5;
    factors.push("limited supply, demand present");
  }

  const investmentScore = Math.max(0, Math.min(100, score));
  let riskLevel: RiskLevel = "medium";
  if (investmentScore >= 70) riskLevel = "low";
  else if (investmentScore < 40) riskLevel = "high";
  const summary = factors.length > 0 ? factors.join("; ") : "Insufficient regional data.";
  return { investmentScore, riskLevel, summary };
}

export async function upsertInvestmentScore(
  propertyIdentityId: string,
  marketRegionId: string,
  data: { investmentScore: number; riskLevel: string; summary?: string | null }
) {
  return prisma.marketInvestmentScore.upsert({
    where: {
      propertyIdentityId_marketRegionId: { propertyIdentityId, marketRegionId },
    },
    create: {
      propertyIdentityId,
      marketRegionId,
      investmentScore: data.investmentScore,
      riskLevel: data.riskLevel,
      summary: data.summary ?? undefined,
    },
    update: {
      investmentScore: data.investmentScore,
      riskLevel: data.riskLevel,
      summary: data.summary ?? undefined,
    },
  });
}

export async function getInvestmentOpportunities(marketRegionId: string, options?: { limit?: number }) {
  return prisma.marketInvestmentScore.findMany({
    where: { marketRegionId },
    orderBy: { investmentScore: "desc" },
    take: options?.limit ?? 50,
    include: {
      propertyIdentity: {
        select: {
          id: true,
          normalizedAddress: true,
          municipality: true,
          province: true,
          propertyType: true,
        },
      },
    },
  });
}

export async function getInvestmentScoreForProperty(propertyIdentityId: string) {
  return prisma.marketInvestmentScore.findMany({
    where: { propertyIdentityId },
    orderBy: { createdAt: "desc" },
    include: { marketRegion: true },
  });
}
