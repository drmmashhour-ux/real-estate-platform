import type { CityKpiMetrics } from "@/src/modules/cities/cityKpiEngine";
import { prisma } from "@/lib/db";
import { normalizeCityKey } from "@/src/modules/cities/cityNormalizer";

export type CityBottleneck = {
  type: string;
  severity: "low" | "medium" | "high";
  summary: string;
  evidence: Record<string, unknown>;
};

function n(m: CityKpiMetrics, k: string): number {
  const v = m[k];
  return typeof v === "number" && Number.isFinite(v) ? v : 0;
}

async function loadLatestKpis(cityKey: string): Promise<CityKpiMetrics> {
  const key = normalizeCityKey(cityKey);
  const snap = await prisma.cityKpiSnapshot.findFirst({
    where: { cityKey: key, snapshotType: "daily" },
    orderBy: { snapshotDate: "desc" },
  });
  return (snap?.metricsJson as CityKpiMetrics) ?? {};
}

export async function detectCitySupplyBottlenecks(cityKey: string): Promise<CityBottleneck[]> {
  const m = await loadLatestKpis(cityKey);
  const out: CityBottleneck[] = [];
  const demand = n(m, "searchSessions");
  const supply = n(m, "activeBnhubListingCount") + n(m, "activeRealEstateListingCount");
  if (demand > 30 && supply < 8) {
    out.push({
      type: "supply_demand_gap",
      severity: demand > 80 ? "high" : "medium",
      summary: "Growth conversations imply demand but active inventory is thin.",
      evidence: { searchSessions: demand, activeListings: supply },
    });
  }
  if (n(m, "activeBnhubListingCount") < 3 && n(m, "activeRealEstateListingCount") < 3) {
    out.push({
      type: "thin_dual_supply",
      severity: "medium",
      summary: "Both BNHub and FSBO published counts are very low.",
      evidence: { bnhub: n(m, "activeBnhubListingCount"), fsbo: n(m, "activeRealEstateListingCount") },
    });
  }
  return out;
}

export async function detectCityTrustBottlenecks(cityKey: string): Promise<CityBottleneck[]> {
  const m = await loadLatestKpis(cityKey);
  const out: CityBottleneck[] = [];
  if (n(m, "fraudHighRiskCount") >= 3) {
    out.push({
      type: "fraud_cluster",
      severity: n(m, "fraudHighRiskCount") >= 8 ? "high" : "medium",
      summary: "Several listings carry high or critical fraud risk scores.",
      evidence: { fraudHighRiskCount: n(m, "fraudHighRiskCount") },
    });
  }
  const avg = n(m, "avgReviewRating");
  if (avg > 0 && avg < 3.6 && n(m, "totalReviewCount") >= 5) {
    out.push({
      type: "weak_reviews",
      severity: "medium",
      summary: "Review average is soft relative to volume.",
      evidence: { avgReviewRating: avg, totalReviewCount: n(m, "totalReviewCount") },
    });
  }
  if (n(m, "trustObjectionRate") > 0.12) {
    out.push({
      type: "trust_objections",
      severity: "high",
      summary: "Elevated trust-related objections in growth conversations.",
      evidence: { trustObjectionRate: n(m, "trustObjectionRate") },
    });
  }
  return out;
}

export async function detectCityConversionBottlenecks(cityKey: string): Promise<CityBottleneck[]> {
  const m = await loadLatestKpis(cityKey);
  const out: CityBottleneck[] = [];
  if (n(m, "highIntentRate") > 0.25 && n(m, "bookedRate") < 0.06) {
    out.push({
      type: "high_intent_low_booking",
      severity: "high",
      summary: "Strong high-intent share but booked rate lags.",
      evidence: { highIntentRate: n(m, "highIntentRate"), bookedRate: n(m, "bookedRate") },
    });
  }
  if (n(m, "listingViews") > 40 && n(m, "completedBookings") < 2) {
    out.push({
      type: "views_without_bookings",
      severity: "medium",
      summary: "FSBO views are present but completed BNHub stays are scarce (check funnel alignment).",
      evidence: { listingViews: n(m, "listingViews"), completedBookings: n(m, "completedBookings") },
    });
  }
  return out;
}

export async function detectCityOperationalBottlenecks(cityKey: string): Promise<CityBottleneck[]> {
  const m = await loadLatestKpis(cityKey);
  const out: CityBottleneck[] = [];
  if (n(m, "staleRate") > 0.35) {
    out.push({
      type: "stale_threads",
      severity: "high",
      summary: "Large share of growth conversations going stale.",
      evidence: { staleRate: n(m, "staleRate") },
    });
  }
  if (n(m, "handoffRate") > 0.3) {
    out.push({
      type: "handoff_pressure",
      severity: "medium",
      summary: "Handoff rate suggests human capacity or playbook strain.",
      evidence: { handoffRate: n(m, "handoffRate") },
    });
  }
  const sla = n(m, "hostSlaHitRate");
  if (sla > 0 && sla < 0.55) {
    out.push({
      type: "host_response_weak",
      severity: "medium",
      summary: "Host response SLA hit rate is weak for this city.",
      evidence: { hostSlaHitRate: sla },
    });
  }
  return out;
}

export async function detectCityRankingBottlenecks(cityKey: string): Promise<CityBottleneck[]> {
  const m = await loadLatestKpis(cityKey);
  const out: CityBottleneck[] = [];
  const avg = n(m, "avgListingRankingScore");
  if (avg > 0 && avg < 42) {
    out.push({
      type: "weak_ranking_distribution",
      severity: "medium",
      summary: "Average persisted BNHub ranking score is low for in-city listings.",
      evidence: { avgListingRankingScore: avg },
    });
  }
  const ctr = n(m, "topCityCtr");
  if (ctr != null && ctr > 0 && ctr < 0.02 && n(m, "rankingImpressions") > 50) {
    out.push({
      type: "low_ctr",
      severity: "medium",
      summary: "Search telemetry suggests impressions without clicks (rough city-level CTR).",
      evidence: { ctr, impressions: n(m, "rankingImpressions") },
    });
  }
  return out;
}

export async function detectCityFraudBottlenecks(cityKey: string): Promise<CityBottleneck[]> {
  const m = await loadLatestKpis(cityKey);
  const out: CityBottleneck[] = [];
  if (n(m, "fraudHighRiskCount") >= 5) {
    out.push({
      type: "fraud_rollout_risk",
      severity: "high",
      summary: "Fraud concentration may block safe promotion in this city.",
      evidence: { fraudHighRiskCount: n(m, "fraudHighRiskCount") },
    });
  }
  return out;
}

export async function detectAllCityBottlenecks(cityKey: string): Promise<CityBottleneck[]> {
  const parts = await Promise.all([
    detectCitySupplyBottlenecks(cityKey),
    detectCityTrustBottlenecks(cityKey),
    detectCityConversionBottlenecks(cityKey),
    detectCityOperationalBottlenecks(cityKey),
    detectCityRankingBottlenecks(cityKey),
    detectCityFraudBottlenecks(cityKey),
  ]);
  return parts.flat();
}
