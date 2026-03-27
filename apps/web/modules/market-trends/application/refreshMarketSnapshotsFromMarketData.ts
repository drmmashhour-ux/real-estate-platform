import type { PrismaClient } from "@prisma/client";
import { confidenceFromSampleSize } from "../infrastructure/trendConfidenceService";
import { slugRegionCity } from "../infrastructure/regionSlug";

/**
 * Aggregates `MarketDataPoint` into `MarketSnapshot` rows (deterministic, conservative).
 */
export async function refreshMarketSnapshotsFromMarketData(db: PrismaClient): Promise<{ upserted: number }> {
  const points = await db.marketDataPoint.findMany({
    orderBy: { date: "desc" },
    take: 3000,
  });

  const groups = new Map<string, typeof points>();
  for (const p of points) {
    const k = `${slugRegionCity(p.city)}|${p.propertyType || "unknown"}|investor`;
    const arr = groups.get(k) ?? [];
    arr.push(p);
    groups.set(k, arr);
  }

  let upserted = 0;
  const snapshotDate = new Date();
  snapshotDate.setUTCHours(0, 0, 0, 0);

  for (const [, arr] of groups) {
    const regionSlug = slugRegionCity(arr[0]!.city);
    const propertyType = arr[0]!.propertyType || "unknown";
    const mode = "investor";

    for (const windowDays of [30, 90, 180]) {
      const cutoff = new Date(Date.now() - windowDays * 86400000);
      const windowPts = arr.filter((p) => p.date >= cutoff);
      if (windowPts.length === 0) continue;

      const medians = windowPts.map((p) => p.medianPriceCents).filter((x): x is number => x != null);
      const median = medians.length ? Math.round(medians.reduce((a, b) => a + b, 0) / medians.length) : null;

      const inv = windowPts.map((p) => p.inventory).filter((x): x is number => x != null);
      const activeListingCount = inv.length ? Math.round(inv.reduce((a, b) => a + b, 0) / inv.length) : 0;

      const txs = windowPts.map((p) => p.transactions).filter((x): x is number => x != null);
      const newListingCount = txs.length ? Math.round(txs.reduce((a, b) => a + b, 0) / txs.length) : 0;

      const confidenceLevel = confidenceFromSampleSize(activeListingCount, windowDays);
      const directionLabel = confidenceLevel === "insufficient_data" ? "insufficient_data" : "neutral";

      await db.marketSnapshot.upsert({
        where: {
          regionSlug_propertyType_mode_analysisWindowDays_snapshotDate: {
            regionSlug,
            propertyType,
            mode,
            analysisWindowDays: windowDays,
            snapshotDate,
          },
        },
        create: {
          regionSlug,
          propertyType,
          mode,
          analysisWindowDays: windowDays,
          snapshotDate,
          medianPriceCents: median != null ? BigInt(median) : null,
          medianPricePerSqft: null,
          activeListingCount,
          newListingCount,
          confidenceLevel,
          directionLabel,
          metadata: { source: "market_data_points", samplePoints: windowPts.length },
        },
        update: {
          medianPriceCents: median != null ? BigInt(median) : null,
          activeListingCount,
          newListingCount,
          confidenceLevel,
          directionLabel,
          metadata: { source: "market_data_points", samplePoints: windowPts.length },
        },
      });
      upserted += 1;
    }
  }

  return { upserted };
}
