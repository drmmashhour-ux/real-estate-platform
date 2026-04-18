import { prisma } from "@/lib/db";
import { Prisma } from "@prisma/client";
import type { DemandSignal } from "./demand.signal";
import type { SupplySignal } from "./supply.signal";

export type CityLiquidityRow = {
  city: string;
  demandScore: number;
  supplyScore: number;
  liquidityScore: number;
  interpretation: "opportunity" | "balanced" | "oversupply";
  demand: DemandSignal;
  supply: SupplySignal;
};

function clamp(n: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, n));
}

/**
 * demand / supply from internal listing + engagement joins (no external market feeds).
 */
export async function computeCityLiquiditySnapshots(limit = 30): Promise<CityLiquidityRow[]> {
  const since = new Date(Date.now() - 7 * 86_400_000);

  const [viewsByCity, savesByCity, activeByCity] = await Promise.all([
    prisma.$queryRaw<Array<{ city: string; c: bigint }>>(
      Prisma.sql`
        SELECT fl.city, COUNT(blv.id)::bigint AS c
        FROM buyer_listing_views blv
        INNER JOIN fsbo_listings fl ON fl.id = blv.fsbo_listing_id
        WHERE blv.created_at >= ${since}
        GROUP BY fl.city
        ORDER BY c DESC
        LIMIT ${limit * 2}
      `,
    ),
    prisma.$queryRaw<Array<{ city: string; c: bigint }>>(
      Prisma.sql`
        SELECT fl.city, COUNT(bsl.id)::bigint AS c
        FROM buyer_saved_listings bsl
        INNER JOIN fsbo_listings fl ON fl.id = bsl.fsbo_listing_id
        WHERE bsl.created_at >= ${since}
        GROUP BY fl.city
        ORDER BY c DESC
        LIMIT ${limit * 2}
      `,
    ),
    prisma.fsboListing.groupBy({
      by: ["city"],
      where: { status: "ACTIVE", moderationStatus: "APPROVED" },
      _count: { id: true },
    }),
  ]);

  const citySet = new Set<string>();
  for (const r of viewsByCity) citySet.add(r.city);
  for (const r of savesByCity) citySet.add(r.city);
  for (const r of activeByCity) citySet.add(r.city);

  const cities = [...citySet].slice(0, limit);

  const rows: CityLiquidityRow[] = [];

  for (const city of cities) {
    const v = Number(viewsByCity.find((x) => x.city === city)?.c ?? 0n);
    const s = Number(savesByCity.find((x) => x.city === city)?.c ?? 0n);
    const active = activeByCity.find((x) => x.city === city)?._count.id ?? 0;

    const demandScore = clamp(Math.log10(v + s * 3 + 3) * 35, 0, 100);
    const supplyScore = clamp(active * 2.5, 1, 200);
    const liquidityScore = clamp((demandScore / Math.max(supplyScore, 1)) * 40, 0, 100);

    const avg = await prisma.fsboListing.aggregate({
      where: { city, status: "ACTIVE", moderationStatus: "APPROVED" },
      _avg: { priceCents: true, trustScore: true },
    });

    let interpretation: CityLiquidityRow["interpretation"] = "balanced";
    if (liquidityScore > 55 && demandScore > 35) interpretation = "opportunity";
    if (supplyScore > 80 && demandScore < 25) interpretation = "oversupply";

    const median = avg._avg.priceCents;
    const demand: DemandSignal = {
      city,
      propertyType: null,
      priceRangeLabel: median ? `~${Math.round(median / 1000)}k CAD median list` : "n/a",
      score: demandScore,
      views7d: v,
      saves7d: s,
      searches7d: 0,
    };

    const supply: SupplySignal = {
      city,
      activeListings: active,
      medianPriceCents: median,
      qualityAvg: avg._avg.trustScore,
    };

    rows.push({
      city,
      demandScore,
      supplyScore,
      liquidityScore,
      interpretation,
      demand,
      supply,
    });
  }

  return rows.sort((a, b) => b.liquidityScore - a.liquidityScore);
}
