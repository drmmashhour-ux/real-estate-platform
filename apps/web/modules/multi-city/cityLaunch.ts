import type { PrismaClient } from "@prisma/client";

export type LaunchCityResult = {
  id: string;
  slug: string;
  status: string;
  listingsEnabled: boolean;
  searchPagesEnabled: boolean;
  growthEngineEnabled: boolean;
  launchDate: Date | null;
};

/**
 * Flip a market to **active** and enable listings, SEO search surfaces, and growth engine flags.
 * Does not migrate data — operators should ensure `cityMatchTerms` cover inventory first.
 */
export async function launchCity(db: PrismaClient, cityId: string): Promise<LaunchCityResult> {
  const updated = await db.city.update({
    where: { id: cityId },
    data: {
      status: "active",
      listingsEnabled: true,
      searchPagesEnabled: true,
      growthEngineEnabled: true,
      launchDate: new Date(),
    },
    select: {
      id: true,
      slug: true,
      status: true,
      listingsEnabled: true,
      searchPagesEnabled: true,
      growthEngineEnabled: true,
      launchDate: true,
    },
  });
  return updated;
}

/** Recompute and persist `expansionScore` for every configured city. */
export async function refreshAllCityExpansionScores(db: PrismaClient): Promise<void> {
  const { getCitySupplyDemandSnapshot } = await import("./cityMetrics");
  const { computeExpansionScore } = await import("./expansionEngine");
  const cities = await db.city.findMany({
    select: {
      id: true,
      slug: true,
      name: true,
      cityMatchTerms: true,
    },
  });
  for (const c of cities) {
    const snap = await getCitySupplyDemandSnapshot(db, c);
    const score = computeExpansionScore(snap);
    await db.city.update({
      where: { id: c.id },
      data: { expansionScore: score },
    });
  }
}
