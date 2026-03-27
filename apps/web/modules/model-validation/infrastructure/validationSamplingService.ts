import type { Prisma, PrismaClient } from "@prisma/client";

export type FreshSetDistribution = {
  strong: number;
  average: number;
  weakIncomplete: number;
  suspicious: number;
};

const DEFAULT_DIST: FreshSetDistribution = {
  strong: 15,
  average: 15,
  weakIncomplete: 10,
  suspicious: 10,
};

const ACTIVE = {
  status: "ACTIVE",
  moderationStatus: "APPROVED",
} as const;

/**
 * Deterministic sampling: `orderBy: { id: "asc" }`, fills buckets until targets or pool exhausted.
 * Uses persisted `trust_score` / `risk_score` as cheap proxies for stratification (not re-scored here).
 */
export async function sampleFreshValidationListings(
  db: PrismaClient,
  options: {
    excludeIds?: string[];
    distribution?: Partial<FreshSetDistribution>;
  } = {},
): Promise<{ listingIds: string[]; counts: FreshSetDistribution; shortfalls: string[] }> {
  const dist = { ...DEFAULT_DIST, ...options.distribution };
  const exclude = new Set(options.excludeIds ?? []);
  const shortfalls: string[] = [];
  const out: string[] = [];

  async function take(where: Prisma.FsboListingWhereInput, label: string, n: number): Promise<void> {
    const pool = await db.fsboListing.findMany({
      where: {
        ...ACTIVE,
        ...where,
        id: { notIn: [...exclude] },
      },
      select: { id: true },
      orderBy: { id: "asc" },
      take: Math.max(n * 6, 48),
    });
    let picked = 0;
    for (const row of pool) {
      if (picked >= n) break;
      if (exclude.has(row.id)) continue;
      exclude.add(row.id);
      out.push(row.id);
      picked++;
    }
    if (picked < n) {
      shortfalls.push(`${label}: wanted ${n}, got ${picked}`);
    }
  }

  await take(
    { trustScore: { gte: 70 } },
    "strong",
    dist.strong,
  );

  await take(
    {
      AND: [
        { trustScore: { gte: 40, lt: 70 } },
      ],
    },
    "average",
    dist.average,
  );

  await take(
    {
      OR: [
        { riskScore: { gte: 55 } },
        {
          AND: [{ trustScore: { lte: 50 } }, { riskScore: { gte: 42 } }],
        },
      ],
    },
    "suspicious",
    dist.suspicious,
  );

  await take(
    {
      OR: [{ trustScore: { lt: 40 } }, { trustScore: null }, { images: { equals: [] } }],
    },
    "weak_incomplete",
    dist.weakIncomplete,
  );

  return {
    listingIds: out,
    counts: dist,
    shortfalls,
  };
}
