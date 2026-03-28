import { prisma } from "@/lib/db";
import { normalizeCityKey } from "@/src/modules/cities/cityNormalizer";

function num(m: Record<string, unknown>, k: string): number {
  const v = m[k];
  return typeof v === "number" && Number.isFinite(v) ? v : 0;
}

async function latestDailyMetrics(cityKey: string): Promise<Record<string, unknown>> {
  const key = normalizeCityKey(cityKey);
  const snap = await prisma.cityKpiSnapshot.findFirst({
    where: { cityKey: key, snapshotType: "daily" },
    orderBy: { snapshotDate: "desc" },
  });
  return (snap?.metricsJson as Record<string, unknown>) ?? {};
}

async function execCityScores(cityKey: string): Promise<Record<string, number>> {
  const raw = cityKey;
  const rows = await prisma.executiveEntityScore.findMany({
    where: { entityType: "city", entityId: raw },
    select: { scoreType: true, scoreValue: true },
  });
  const alt = await prisma.executiveEntityScore.findMany({
    where: { entityType: "city", entityId: normalizeCityKey(cityKey) },
    select: { scoreType: true, scoreValue: true },
  });
  const out: Record<string, number> = {};
  for (const r of [...rows, ...alt]) {
    out[r.scoreType] = r.scoreValue;
  }
  return out;
}

export async function computeCityLaunchReadinessScore(cityKey: string): Promise<number> {
  const m = await latestDailyMetrics(cityKey);
  const supply = num(m, "activeBnhubListingCount") + num(m, "activeRealEstateListingCount");
  const verified = num(m, "verifiedListingCount");
  const hosts = num(m, "verifiedHostCount");
  const fraud = num(m, "fraudHighRiskCount");
  const avgRating = num(m, "avgReviewRating");
  const fraudPenalty = Math.min(40, fraud * 4);
  const trustBoost = avgRating > 0 ? Math.min(25, (avgRating - 3) * 8) : 0;
  return Math.max(
    0,
    Math.min(
      100,
      Math.log1p(supply) * 12 + Math.log1p(verified) * 8 + Math.log1p(hosts) * 10 + trustBoost - fraudPenalty
    )
  );
}

export async function computeCityGrowthScore(cityKey: string): Promise<number> {
  const m = await latestDailyMetrics(cityKey);
  const sessions = num(m, "searchSessions");
  const views = num(m, "listingViews");
  const hi = num(m, "highIntentRate");
  const repeat = num(m, "repeatVisitorCount");
  const exec = await execCityScores(cityKey);
  const priority = exec.priority ?? 0;
  return Math.max(
    0,
    Math.min(100, Math.log1p(sessions) * 8 + Math.log1p(views) * 4 + hi * 35 + Math.log1p(repeat) * 5 + priority * 3)
  );
}

export async function computeCityTrustScore(cityKey: string): Promise<number> {
  const m = await latestDailyMetrics(cityKey);
  const avgR = num(m, "avgReviewRating");
  const host = num(m, "avgHostScore");
  const fraud = num(m, "fraudHighRiskCount");
  const obj = num(m, "trustObjectionRate");
  const reviewPart = avgR > 0 ? ((avgR - 1) / 4) * 40 : 10;
  const hostPart = host != null ? (host / 100) * 35 : 10;
  const fraudPart = Math.max(0, 25 - Math.min(25, fraud * 2));
  const objPart = Math.max(0, 15 - obj * 50);
  return Math.max(0, Math.min(100, reviewPart + hostPart + fraudPart + objPart));
}

export async function computeCityConversionScore(cityKey: string): Promise<number> {
  const m = await latestDailyMetrics(cityKey);
  const booked = num(m, "bookedRate");
  const hiConv = num(m, "highIntentConversionRate");
  const stale = num(m, "staleRate");
  const handoff = num(m, "handoffRate");
  return Math.max(
    0,
    Math.min(100, booked * 55 + hiConv * 30 + (1 - stale) * 10 + (1 - handoff) * 5)
  );
}

export async function computeCityOperationalHealthScore(cityKey: string): Promise<number> {
  const m = await latestDailyMetrics(cityKey);
  const sla = num(m, "hostSlaHitRate");
  const stale = num(m, "staleRate");
  const handoff = num(m, "handoffRate");
  const base = sla > 0 ? sla * 55 : 25;
  return Math.max(0, Math.min(100, base + (1 - stale) * 25 + (1 - handoff) * 20));
}

export async function computeOverallCityPriorityScore(cityKey: string): Promise<number> {
  const s = await computeAllCityScores(cityKey);
  return s.priority;
}

export async function computeAllCityScores(cityKey: string): Promise<{
  launchReadiness: number;
  growth: number;
  trust: number;
  conversion: number;
  operationalHealth: number;
  priority: number;
}> {
  const [launchReadiness, growth, trust, conversion, operationalHealth] = await Promise.all([
    computeCityLaunchReadinessScore(cityKey),
    computeCityGrowthScore(cityKey),
    computeCityTrustScore(cityKey),
    computeCityConversionScore(cityKey),
    computeCityOperationalHealthScore(cityKey),
  ]);
  const priority = Math.round(
    launchReadiness * 0.22 + growth * 0.28 + trust * 0.2 + conversion * 0.2 + operationalHealth * 0.1
  );
  return { launchReadiness, growth, trust, conversion, operationalHealth, priority };
}
