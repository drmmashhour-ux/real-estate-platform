import type { LecipmTrustEngineTargetType, LecipmTrustOperationalBand, PrismaClient } from "@prisma/client";
import { subDays } from "date-fns";

type SnapshotRow = {
  id: string;
  targetType: LecipmTrustEngineTargetType;
  targetId: string;
  trustScore: number;
  trustBand: LecipmTrustOperationalBand;
  deltaFromPrior: number | null;
  contributingFactorsJson: unknown;
  explainJson: unknown;
  createdAt: Date;
};

function dedupeLatest(rows: SnapshotRow[]): Map<string, SnapshotRow> {
  const map = new Map<string, SnapshotRow>();
  for (const row of rows) {
    const k = `${row.targetType}:${row.targetId}`;
    if (!map.has(k)) map.set(k, row);
  }
  return map;
}

function factorCountsFromSnapshots(latest: Iterable<SnapshotRow>): Array<{ factorId: string; negativeWeight: number }> {
  const agg = new Map<string, number>();
  for (const row of latest) {
    const arr = row.contributingFactorsJson as Array<{ factorId: string; contribution: number }> | null;
    if (!Array.isArray(arr)) continue;
    for (const f of arr) {
      if (f.contribution >= -0.25) continue;
      agg.set(f.factorId, (agg.get(f.factorId) ?? 0) + Math.abs(f.contribution));
    }
  }
  return [...agg.entries()]
    .map(([factorId, negativeWeight]) => ({ factorId, negativeWeight }))
    .sort((a, b) => b.negativeWeight - a.negativeWeight)
    .slice(0, 12);
}

/**
 * Admin dashboard payload — works off recent snapshots (v1 freshness trade-off).
 */
export async function loadOperationalTrustAdminDashboard(db: PrismaClient) {
  const windowStart = subDays(new Date(), 21);
  const recent = (await db.lecipmOperationalTrustSnapshot.findMany({
    where: { createdAt: { gte: windowStart } },
    orderBy: { createdAt: "desc" },
    take: 600,
  })) as SnapshotRow[];

  const latest = dedupeLatest(recent);
  const values = [...latest.values()];

  const overview = {
    totalTargets: values.length,
    byBand: {} as Record<LecipmTrustOperationalBand, number>,
  };
  for (const b of ["HIGH_TRUST", "GOOD", "WATCH", "ELEVATED_RISK", "CRITICAL_REVIEW"] as const) {
    overview.byBand[b] = 0;
  }
  for (const v of values) {
    overview.byBand[v.trustBand] += 1;
  }

  const brokersByBand = bandBreakdown(values.filter((v) => v.targetType === "BROKER"));
  const listingsByBand = bandBreakdown(values.filter((v) => v.targetType === "LISTING"));

  const deltas = recent.filter((r) => r.deltaFromPrior != null);
  const sharpestDrops = [...deltas]
    .sort((a, b) => (a.deltaFromPrior ?? 0) - (b.deltaFromPrior ?? 0))
    .slice(0, 12)
    .map(rowToDeltaSummary);
  const mostImproved = [...deltas]
    .sort((a, b) => (b.deltaFromPrior ?? 0) - (a.deltaFromPrior ?? 0))
    .slice(0, 12)
    .map(rowToDeltaSummary);

  const topNegativeFactors = factorCountsFromSnapshots(values);

  const improvementIdeas = [
    "Confirm documentation slots are complete before high-visibility publishes.",
    "Enable visit confirmation templates and reschedule nudges for active territories.",
    "Route repeated friction themes into coaching snippets — not punitive defaults.",
    "Pair trust deltas with dispute prediction prevention logs for holistic review.",
  ];

  return {
    generatedAt: new Date().toISOString(),
    overview,
    brokersByBand,
    listingsByBand,
    sharpestDrops,
    mostImproved,
    topNegativeFactors,
    improvementIdeas,
    safetyNote:
      "Trust outputs are operational signals — combine with policy review before major suppression or automated enforcement.",
  };
}

function bandBreakdown(rows: SnapshotRow[]) {
  const out: Record<LecipmTrustOperationalBand, number> = {
    HIGH_TRUST: 0,
    GOOD: 0,
    WATCH: 0,
    ELEVATED_RISK: 0,
    CRITICAL_REVIEW: 0,
  };
  for (const r of rows) {
    out[r.trustBand] += 1;
  }
  return out;
}

function rowToDeltaSummary(r: SnapshotRow) {
  return {
    targetType: r.targetType,
    targetId: r.targetId,
    trustScore: r.trustScore,
    trustBand: r.trustBand,
    deltaFromPrior: r.deltaFromPrior,
    snapshotAt: r.createdAt.toISOString(),
  };
}

export async function loadOperationalTrustLatestForTargetType(
  db: PrismaClient,
  targetType: LecipmTrustEngineTargetType,
) {
  const windowStart = subDays(new Date(), 21);
  const recent = (await db.lecipmOperationalTrustSnapshot.findMany({
    where: { targetType, createdAt: { gte: windowStart } },
    orderBy: { createdAt: "desc" },
    take: 500,
  })) as SnapshotRow[];
  const latest = dedupeLatest(recent);
  return [...latest.values()].map((r) => ({
    targetType: r.targetType,
    targetId: r.targetId,
    trustScore: r.trustScore,
    trustBand: r.trustBand,
    deltaFromPrior: r.deltaFromPrior,
    snapshotAt: r.createdAt.toISOString(),
  }));
}

export async function loadOperationalTrustMobileSummary(db: PrismaClient) {
  const dash = await loadOperationalTrustAdminDashboard(db);
  return {
    overview: dash.overview,
    sharpestDrops: dash.sharpestDrops.slice(0, 8),
    mostImproved: dash.mostImproved.slice(0, 8),
    topNegativeFactors: dash.topNegativeFactors.slice(0, 8),
    generatedAt: dash.generatedAt,
    safetyNote: dash.safetyNote,
  };
}
