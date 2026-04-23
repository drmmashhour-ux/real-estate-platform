import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { average, median, safePricePerSqft, safeYield } from "@/lib/neighborhood/metrics";
import { computeNeighborhoodScores } from "@/lib/neighborhood/scoring";

export function normalizeNeighborhoodKey(city: string, neighborhoodName: string) {
  return `${city.trim().toLowerCase()}::${neighborhoodName.trim().toLowerCase()}`;
}

function rentFromComparable(c: { metadata: Prisma.JsonValue | null }): number {
  if (!c.metadata || typeof c.metadata !== "object" || Array.isArray(c.metadata)) return 0;
  const m = c.metadata as Record<string, unknown>;
  const a = m.avgRentCents;
  const b = m.monthlyRentCents;
  if (typeof a === "number" && Number.isFinite(a)) return a;
  if (typeof b === "number" && Number.isFinite(b)) return b;
  return 0;
}

function metadataNeighborhoodName(c: { metadata: Prisma.JsonValue | null }): string | null {
  if (!c.metadata || typeof c.metadata !== "object" || Array.isArray(c.metadata)) return null;
  const m = c.metadata as Record<string, unknown>;
  const n = m.neighborhoodName;
  return typeof n === "string" ? n : null;
}

export async function rebuildNeighborhoodProfile(
  city: string,
  neighborhoodName: string,
  province = "QC",
  trendChangeRatio = 0.04,
) {
  const trimmedCity = city.trim();
  const trimmedHood = neighborhoodName.trim();

  const comps = await prisma.comparableProperty.findMany({
    where: {
      city: { equals: trimmedCity, mode: "insensitive" },
      province,
      OR: [
        { neighborhoodName: { equals: trimmedHood, mode: "insensitive" } },
        { metadata: { path: ["neighborhoodName"], equals: trimmedHood } },
      ],
    },
  });

  const prices = comps.map((c) => c.salePriceCents ?? 0).filter((n) => n > 0);
  const rents = comps.map((c) => rentFromComparable(c)).filter((n) => n > 0);
  const ppsf = comps.map((c) => safePricePerSqft(c.salePriceCents, c.buildingAreaSqft)).filter((n) => n > 0);

  const avgSalePriceCents = Math.round(average(prices));
  const avgPricePerSqftCents = Math.round(median(ppsf));
  const avgRentCents = Math.round(average(rents));
  const comparableCount = comps.length;
  const inventoryCount = comps.filter((c) => (c.listingStatus ?? "").toLowerCase() === "active").length;

  const yieldRatio = safeYield(avgRentCents || null, avgSalePriceCents || null);

  const scores = computeNeighborhoodScores({
    avgSalePriceCents: avgSalePriceCents || 0,
    avgPricePerSqftCents: avgPricePerSqftCents || 0,
    avgRentCents: avgRentCents || 0,
    comparableCount,
    inventoryCount,
    yieldRatio,
    trendChangeRatio,
  });

  const neighborhoodKey = normalizeNeighborhoodKey(trimmedCity, trimmedHood);

  const lowConfidence = comparableCount < 3;

  const metrics: Record<string, unknown> = {
    comparableCount,
    inventoryCount,
    trendChangeRatio,
    yieldRatio,
    lowConfidence,
    sampleNeighborhoods: [...new Set(comps.map((c) => metadataNeighborhoodName(c) ?? c.neighborhoodName))].slice(0, 8),
  };

  const profile = await prisma.neighborhoodProfile.upsert({
    where: { neighborhoodKey },
    update: {
      city: trimmedCity,
      province,
      neighborhoodName: trimmedHood,
      avgSalePriceCents: avgSalePriceCents || null,
      avgPricePerSqftCents: avgPricePerSqftCents || null,
      avgRentCents: avgRentCents || null,
      inventoryCount,
      comparableCount,
      scoreOverall: scores.scoreOverall,
      scoreDemand: scores.scoreDemand,
      scoreValue: scores.scoreValue,
      scoreYield: scores.scoreYield,
      scoreRisk: scores.scoreRisk,
      trendDirection: scores.trendDirection,
      investmentZone: scores.investmentZone,
      metrics: metrics as Prisma.InputJsonValue,
    },
    create: {
      city: trimmedCity,
      province,
      neighborhoodKey,
      neighborhoodName: trimmedHood,
      avgSalePriceCents: avgSalePriceCents || null,
      avgPricePerSqftCents: avgPricePerSqftCents || null,
      avgRentCents: avgRentCents || null,
      inventoryCount,
      comparableCount,
      scoreOverall: scores.scoreOverall,
      scoreDemand: scores.scoreDemand,
      scoreValue: scores.scoreValue,
      scoreYield: scores.scoreYield,
      scoreRisk: scores.scoreRisk,
      trendDirection: scores.trendDirection,
      investmentZone: scores.investmentZone,
      metrics: metrics as Prisma.InputJsonValue,
    },
  });

  await prisma.neighborhoodScoreRun.create({
    data: {
      neighborhoodProfileId: profile.id,
      runType: "manual",
      scoreOverall: scores.scoreOverall,
      scoreDemand: scores.scoreDemand,
      scoreValue: scores.scoreValue,
      scoreYield: scores.scoreYield,
      scoreRisk: scores.scoreRisk,
      trendDirection: scores.trendDirection,
      investmentZone: scores.investmentZone,
      rationale: {
        comparableCount,
        inventoryCount,
        trendChangeRatio,
        yieldRatio,
        lowConfidence,
      } as Prisma.InputJsonValue,
    },
  });

  return profile;
}
