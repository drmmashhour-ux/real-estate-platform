import { prisma } from "@/lib/db";
import { normalizeCityKey } from "@/src/modules/cities/cityNormalizer";
import { getCityOperationProfile } from "@/src/modules/cities/cityConfigService";
import { computeAllCityScores } from "@/src/modules/cities/cityScoringEngine";
import { latestDailyMetricsForCity } from "@/src/modules/cities/cityRolloutHelpers";

export type LaunchChecklistItem = { id: string; ok: boolean; detail: string };

async function metricsForPlaybook(cityKey: string): Promise<Record<string, unknown>> {
  return latestDailyMetricsForCity(cityKey);
}

function n(m: Record<string, unknown>, k: string): number {
  const v = m[k];
  return typeof v === "number" && Number.isFinite(v) ? v : 0;
}

export async function getCityLaunchChecklist(cityKey: string): Promise<LaunchChecklistItem[]> {
  const key = normalizeCityKey(cityKey);
  const profile = await getCityOperationProfile(key);
  const m = await metricsForPlaybook(key);
  const minListings = 5;
  const minHosts = 2;
  const minTrust = 55;

  const scores = await computeAllCityScores(key).catch(() => null);

  return [
    {
      id: "profile",
      ok: !!profile,
      detail: profile ? `Profile ${profile.cityName} (${profile.launchStage})` : "Create city_operation_profiles row",
    },
    {
      id: "listings",
      ok: n(m, "activeListingCount") >= minListings,
      detail: `Active listings (BNHUB+FSBO): ${n(m, "activeListingCount")} (min ${minListings})`,
    },
    {
      id: "hosts",
      ok: n(m, "verifiedHostCount") >= minHosts,
      detail: `Hosts with published BNHUB: ${n(m, "verifiedHostCount")} (min ${minHosts})`,
    },
    {
      id: "trust_score",
      ok: scores ? scores.trust >= minTrust : false,
      detail: scores ? `Composite trust score ~${scores.trust}` : "Run daily KPI job first",
    },
    {
      id: "fraud",
      ok: n(m, "fraudHighRiskCount") <= 5,
      detail: `High/critical fraud listings: ${n(m, "fraudHighRiskCount")} (target ≤5)`,
    },
    {
      id: "ranking_config",
      ok: !!profile?.rankingConfigKey?.trim() || true,
      detail: profile?.rankingConfigKey
        ? `Custom ranking config: ${profile.rankingConfigKey}`
        : "Optional: set rankingConfigKey on profile for A/B weights",
    },
    {
      id: "reviews",
      ok: n(m, "totalReviewCount") >= 0,
      detail: `Reviews counted: ${n(m, "totalReviewCount")}`,
    },
  ];
}

export async function evaluateCityForLaunch(cityKey: string): Promise<{
  ready: boolean;
  checklist: LaunchChecklistItem[];
  blockers: string[];
}> {
  const checklist = await getCityLaunchChecklist(cityKey);
  const blockers = checklist.filter((c) => !c.ok).map((c) => `${c.id}: ${c.detail}`);
  const ready = blockers.length === 0;
  return { ready, checklist, blockers };
}

export async function getCityGoLiveRecommendation(cityKey: string): Promise<string> {
  const { ready, blockers } = await evaluateCityForLaunch(cityKey);
  if (ready) {
    return `City ${normalizeCityKey(cityKey)} passes internal launch checklist; activate with admin API when ops sign off.`;
  }
  return `Not ready: ${blockers.slice(0, 4).join(" | ")}`;
}
