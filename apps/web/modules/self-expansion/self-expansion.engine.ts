import { buildCeoContext } from "@/modules/ai-ceo/ai-ceo.engine";
import { buildCityLaunchFullView } from "@/modules/city-launch/city-launch.service";
import { generateExpansionRecommendations } from "@/modules/self-expansion/self-expansion-recommendation.service";
import { loadLearningWeights } from "@/modules/self-expansion/self-expansion-learning.service";
import { selfExpansionLog } from "@/modules/self-expansion/self-expansion-log";
import type {
  SelfExpansionPlatformContext,
  SelfExpansionRecommendationDraft,
  TerritoryArchetype,
  TerritoryExpansionProfile,
} from "@/modules/self-expansion/self-expansion.types";
import { runGrowthBrainSnapshot } from "@/modules/growth-brain/growth-brain.service";
import { buildMarketDominationSnapshot } from "@/modules/market-domination/market-domination.service";
import type { MarketDominationSnapshot } from "@/modules/market-domination/market-domination.service";
import type { Territory } from "@/modules/market-domination/market-domination.types";
import { getRevenuePredictorAdminSummary } from "@/modules/revenue-predictor/revenue-predictor.service";

function clamp01(n: number): number {
  return Math.max(0, Math.min(1, n));
}

export function inferArchetype(t: Territory): TerritoryArchetype {
  const id = t.id.toLowerCase();
  const name = t.name.toLowerCase();
  if (id.includes("old") || name.includes("old montreal")) return "tourist_corridor";
  if (id.includes("westmount") || name.includes("westmount")) return "investor_dense";
  if (id.includes("laval")) return "satellite_commuter";
  if (t.scope === "REGION") return "regional_hub";
  if ((t.metrics.activeBrokers ?? 0) < 35) return "sprawl_low_density";
  return "metro_core";
}

/** Configurable readiness inputs — extend with DB-driven rules per deployment. */
export function regulatoryFlagsForTerritory(t: Territory): string[] {
  const flags: string[] = ["manual_counsel_review_before_paid_scale"];
  if (t.regionLabel?.toLowerCase().includes("province")) {
    flags.push("multi_jurisdiction_alignment");
  }
  if (process.env.SELF_EXPANSION_EXTRA_REG_FLAGS) {
    flags.push(
      ...process.env.SELF_EXPANSION_EXTRA_REG_FLAGS.split(",").map((s) => s.trim()).filter(Boolean)
    );
  }
  return flags;
}

export function mapTerritoryExpansionProfile(args: {
  territory: Territory;
  dom: MarketDominationSnapshot;
  thinDataWarnings: string[];
}): TerritoryExpansionProfile {
  const { territory: t, dom, thinDataWarnings } = args;
  const domination = dom.dominationByTerritory[t.id]?.score ?? 0;
  const readiness = dom.readinessByTerritory[t.id];
  const readinessScore = readiness?.score ?? 45;
  const readinessBand = readiness?.band ?? "EMERGING";
  const competitorPressure = dom.competitorByTerritory[t.id]?.pressureScore ?? 3;
  const prioritized = dom.prioritized.find((p) => p.territoryId === t.id);
  const strategicFit = prioritized ? Math.round(prioritized.priorityScore * 100) : 48;

  const m = t.metrics;
  const operationalCapacity = Math.round(
    100 *
      clamp01(m.activeBrokers / 85 + m.activeUsers / 2200 + m.leadVolume / 400)
  );

  const bnhubOpportunity = Math.round(
    100 * clamp01(m.renterDemand / 140 + m.bookingVolume / 700 + (110 - m.bnhubSupply) / 160)
  );

  return {
    territoryId: t.id,
    city: t.name,
    region: t.regionLabel,
    country: "CA",
    archetype: inferArchetype(t),
    readinessScore,
    readinessBand,
    dominationScore: domination,
    strategicFit,
    demandSignals: {
      buyer: m.buyerDemand,
      renter: m.renterDemand,
      investor: m.investorActivity,
      leadVolume: m.leadVolume,
    },
    supplySignals: {
      listings: m.listingsCount,
      bnhub: m.bnhubSupply,
      residence: m.residenceServicesSupply,
      ratio: m.supplyDemandRatio,
    },
    brokerDensity: m.activeBrokers,
    bnhubOpportunity,
    investorInterest: m.investorActivity,
    competitorPressure,
    regulatoryReadinessFlags: regulatoryFlagsForTerritory(t),
    operationalCapacity,
    currentTraction: {
      revenueCents: m.revenueCents,
      bookings: m.bookingVolume,
      conversionRate: m.conversionRate,
      growthRate: m.growthRate,
    },
    coverageWarnings: thinDataWarnings.length ? thinDataWarnings : undefined,
  };
}

export async function buildExpansionContext(): Promise<SelfExpansionPlatformContext> {
  const dom = buildMarketDominationSnapshot();
  const [ceoCtx, rev] = await Promise.all([buildCeoContext(), Promise.resolve(getRevenuePredictorAdminSummary())]);

  let growthRegion: string | null = null;
  try {
    const brain = runGrowthBrainSnapshot();
    growthRegion = brain.opportunities[0]?.region ?? null;
  } catch {
    growthRegion = null;
  }

  const thinDataWarnings = [...ceoCtx.coverage.thinDataWarnings];
  if (!dom.territories.length) thinDataWarnings.push("No territories in domination snapshot");

  const territories = dom.territories.map((t) =>
    mapTerritoryExpansionProfile({ territory: t, dom, thinDataWarnings })
  );

  return {
    generatedAt: new Date().toISOString(),
    territories,
    marketDominationGeneratedAt: dom.generatedAtIso,
    aiCeo: {
      thinDataWarnings: ceoCtx.coverage.thinDataWarnings,
      executiveRisk: ceoCtx.executive?.riskLevel ?? null,
    },
    revenuePredictor: {
      generatedAtIso: rev.generatedAtIso,
      totalForecastBaseCents: rev.totalForecastBaseCents,
      repCount: rev.repCount,
      biggestLeakCents: rev.biggestLeakCents,
      biggestUpsideCents: rev.biggestUpsideCents,
    },
    growthBrainTopRegion: growthRegion,
    regulatoryDisclaimer:
      "Expansion recommendations are advisory. Regulatory posture must be validated per jurisdiction — this engine stores configurable flags only.",
    thinDataWarnings,
  };
}

export async function playbookCompletionMap(): Promise<Record<string, number | null>> {
  const dom = buildMarketDominationSnapshot();
  const map: Record<string, number | null> = {};
  for (const t of dom.territories) {
    try {
      const v = buildCityLaunchFullView(t.id);
      map[t.id] = v?.progress.completionPercent ?? null;
    } catch {
      map[t.id] = null;
    }
  }
  return map;
}

export async function buildExpansionRecommendationSet(): Promise<{
  context: SelfExpansionPlatformContext;
  recommendations: SelfExpansionRecommendationDraft[];
}> {
  const context = await buildExpansionContext();
  const learning = await loadLearningWeights();
  const playbook = await playbookCompletionMap();
  const recommendations = generateExpansionRecommendations(context, learning, playbook);
  selfExpansionLog("info", "recommendations_built", { count: recommendations.length });
  return { context, recommendations };
}
