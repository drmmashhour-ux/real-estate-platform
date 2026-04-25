import { getRevenuePredictorAdminSummary } from "@/modules/revenue-predictor/revenue-predictor.service";
import { prioritizeOpportunities } from "@/modules/growth-brain/growth-brain-prioritization.service";
import { aggregateGrowthSignals } from "@/modules/growth-brain/growth-brain-signals.service";
import { recommendActionsFromOpportunities } from "@/modules/growth-brain/growth-brain-actions.service";
import { getTerritoryDetail, loadTerritories } from "@/modules/market-domination/market-domination.service";
import { explainTerritoryScore } from "@/modules/market-domination/market-domination-explainability.service";
import { computeHubPenetration } from "@/modules/market-domination/market-penetration.service";
import type { HubType } from "@/modules/market-domination/market-domination.types";

import type { LaunchIntegrationSnapshot } from "./city-launch.types";

function dominantHubsFromPenetration(territoryId: string): HubType[] {
  const detail = getTerritoryDetail(territoryId);
  if (!detail?.territory) return ["BUYER", "BNHUB", "BROKER"];
  const pen = detail.penetration ?? computeHubPenetration(detail.territory.metrics);
  return [...pen].sort((a, b) => b.score - a.score).slice(0, 4).map((p) => p.hub);
}

function matchesTerritory(region: string | undefined, territoryName: string, regionLabel: string): boolean {
  if (!region) return false;
  const r = region.toLowerCase();
  return r.includes(territoryName.slice(0, 4).toLowerCase()) || r.includes(regionLabel.slice(0, 4).toLowerCase());
}

/** Aggregates signals from Domination + Growth Brain + Revenue Predictor (marketing/sales/leads implicit in brain). */
export function gatherLaunchIntegrationSnapshot(territoryId: string): LaunchIntegrationSnapshot | null {
  const territories = loadTerritories();
  const t = territories.find((x) => x.id === territoryId);
  if (!t) return null;

  const detail = getTerritoryDetail(territoryId);
  const readinessScore = detail?.readiness?.score ?? 0;
  const readinessBand = detail?.readiness?.band ?? "EMERGING";
  const dominationScore = detail?.domination?.score ?? 50;
  const competitorPressure = detail?.competitor?.pressureScore ?? 3;

  const pen = detail?.penetration ?? computeHubPenetration(t.metrics);
  const explain = detail?.territory && detail.domination
    ? explainTerritoryScore(t, detail.domination, pen)
    : null;

  const gaps = detail?.gaps ?? [];
  const gapsSummary = gaps.slice(0, 6).map((g) => `${g.gapType}: ${g.recommendedNextMove.slice(0, 80)}`);

  let growthOpportunityTitles: string[] = [];
  let growthActionSummaries: string[] = [];
  try {
    const signals = aggregateGrowthSignals();
    const opportunities = prioritizeOpportunities(signals);
    const filtered = opportunities.filter((o) => matchesTerritory(o.region, t.name, t.regionLabel));
    const pick = filtered.length ? filtered : opportunities;
    growthOpportunityTitles = pick.slice(0, 5).map((o) => o.title);
    const actions = recommendActionsFromOpportunities(opportunities, "ASSIST", 8);
    growthActionSummaries = actions.slice(0, 5).map((a) => `${a.actionType}: ${a.reason.slice(0, 90)}`);
  } catch {
    growthOpportunityTitles = [];
    growthActionSummaries = [];
  }

  let revenuePredictorNote: string | null = null;
  try {
    const rev = getRevenuePredictorAdminSummary();
    revenuePredictorNote = `Org forecast base ~${Math.round(rev.baseCents / 100)} (CAD); ${rev.repCount} reps modeled. Upside/leak signals for pacing — territory execution still drives local wins.`;
  } catch {
    revenuePredictorNote = null;
  }

  const dominantHubs = dominantHubsFromPenetration(territoryId);

  return {
    territoryId: t.id,
    territoryName: t.name,
    regionLabel: t.regionLabel,
    readinessScore,
    readinessBand,
    dominationScore,
    competitorPressure,
    supplyDemandRatio: t.metrics.supplyDemandRatio,
    conversionRate: t.metrics.conversionRate,
    leadVolumeProxy: t.metrics.leadVolume,
    dominantHubs,
    gapsSummary,
    growthOpportunityTitles,
    growthActionSummaries,
    revenuePredictorNote,
  };
}
