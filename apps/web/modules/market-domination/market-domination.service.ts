import { DEFAULT_DOMINATION_WEIGHTS } from "./market-domination.config";
import {
  buildCompetitorPressureView,
  competitorsForTerritory,
  listCompetitors,
  upsertCompetitor,
} from "./market-competitor-tracking.service";
import { analyzeMarketGaps } from "./market-gap-analysis.service";
import { scoreExpansionReadiness } from "./market-expansion-readiness.service";
import { computeHubPenetration } from "./market-penetration.service";
import { prioritizeMarkets } from "./market-prioritization.service";
import { explainTerritoryScore } from "./market-domination-explainability.service";

import type {
  GapType,
  HubType,
  MarketGap,
  ReadinessBand,
  StrategicRecommendation,
  Territory,
  TerritoryDomination,
  TerritoryMetrics,
  TerritoryScope,
} from "./market-domination.types";

const STATE_KEY = "lecipm-market-domination-state-v1";
const TERRITORY_KEY = "lecipm-market-territories-v1";

export type MarketDominationState = {
  lastDominationScores: Record<string, number>;
};

function defaultState(): MarketDominationState {
  return { lastDominationScores: {} };
}

let stateMem = defaultState();

function loadDominationState(): MarketDominationState {
  if (typeof localStorage !== "undefined") {
    try {
      const raw = localStorage.getItem(STATE_KEY);
      if (raw) stateMem = { ...defaultState(), ...JSON.parse(raw) } as MarketDominationState;
    } catch {
      /* ignore */
    }
  }
  return stateMem;
}

function saveDominationState(s: MarketDominationState): void {
  stateMem = s;
  if (typeof localStorage !== "undefined") {
    try {
      localStorage.setItem(STATE_KEY, JSON.stringify(s));
    } catch {
      /* quota */
    }
  }
}

export function resetMarketDominationStateForTests(): void {
  stateMem = defaultState();
  if (typeof localStorage !== "undefined") {
    try {
      localStorage.removeItem(STATE_KEY);
      localStorage.removeItem(TERRITORY_KEY);
    } catch {
      /* noop */
    }
  }
}

function readinessRank(b: ReadinessBand): number {
  return { NOT_READY: 0, EMERGING: 1, READY: 2, PRIORITY: 3 }[b];
}

function clamp01(n: number): number {
  return Math.max(0, Math.min(1, n));
}

export function defaultSeedTerritories(): Territory[] {
  const mk = (
    id: string,
    name: string,
    scope: TerritoryScope,
    slug: string,
    regionLabel: string,
    metrics: Partial<TerritoryMetrics>
  ): Territory => {
    const base: TerritoryMetrics = {
      listingsCount: 180,
      activeBrokers: 42,
      bnhubSupply: 55,
      investorActivity: 48,
      residenceServicesSupply: 38,
      buyerDemand: 95,
      renterDemand: 72,
      leadVolume: 140,
      bookingVolume: 260,
      revenueCents: 120_000_000,
      conversionRate: 0.16,
      growthRate: 0.08,
      activeUsers: 620,
      supplyDemandRatio: 0.92,
      ...metrics,
    };
    return { id, name, scope, slug, regionLabel, metrics: base };
  };

  return [
    mk("mtl-core", "Montréal", "CITY", "montreal", "Greater Montréal", {
      listingsCount: 420,
      activeBrokers: 78,
      bnhubSupply: 110,
      bookingVolume: 520,
      revenueCents: 420_000_000,
      growthRate: 0.09,
    }),
    mk("westmount", "Westmount", "CITY", "westmount", "Montréal West", {
      listingsCount: 95,
      activeBrokers: 28,
      buyerDemand: 62,
      revenueCents: 210_000_000,
      conversionRate: 0.22,
      growthRate: 0.03,
    }),
    mk("laval", "Laval", "CITY", "laval", "Laval", {
      listingsCount: 210,
      activeBrokers: 44,
      investorActivity: 72,
    }),
    mk("old-mtl", "Old Montréal", "DISTRICT", "old-montreal", "Ville-Marie", {
      bnhubSupply: 48,
      bookingVolume: 640,
      buyerDemand: 130,
      renterDemand: 88,
      supplyDemandRatio: 0.72,
      growthRate: 0.14,
    }),
    mk("qc-region", "Québec", "REGION", "quebec-region", "Province — QC", {
      listingsCount: 900,
      activeBrokers: 120,
      activeUsers: 2100,
      growthRate: 0.05,
      supplyDemandRatio: 1.05,
    }),
  ];
}

function fixLavalTerritory(): Territory {
  const base = defaultSeedTerritories().find((t) => t.id === "laval")!;
  return {
    ...base,
    metrics: {
      ...base.metrics,
      listingsCount: 210,
      investorActivity: 72,
    },
  };
}

export function loadTerritories(): Territory[] {
  const seed = defaultSeedTerritories().map((t) => (t.id === "laval" ? fixLavalTerritory() : t));
  if (typeof localStorage !== "undefined") {
    try {
      const raw = localStorage.getItem(TERRITORY_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as { territories: Territory[] };
        if (parsed.territories?.length) return parsed.territories;
      }
    } catch {
      /* ignore */
    }
  }
  return seed;
}

export function saveTerritories(territories: Territory[]): void {
  if (typeof localStorage !== "undefined") {
    try {
      localStorage.setItem(TERRITORY_KEY, JSON.stringify({ territories }));
    } catch {
      /* quota */
    }
  }
}

export function computeTerritoryDomination(
  t: Territory,
  penetrationAvg: number
): TerritoryDomination {
  const m = t.metrics;
  const w = DEFAULT_DOMINATION_WEIGHTS;

  const revenueContribution = clamp01(m.revenueCents / 800_000_000 + m.bookingVolume / 800);
  const supplyCoverage = clamp01(m.supplyDemandRatio);
  const demandCapture = clamp01((m.buyerDemand + m.renterDemand) / 320);
  const repeatUsage = clamp01(m.activeUsers / 2500);
  const growthMomentum = clamp01(0.5 + m.growthRate);

  const score =
    (w.penetration * penetrationAvg +
      w.revenueContribution * revenueContribution +
      w.supplyCoverage * supplyCoverage +
      w.demandCapture * demandCapture +
      w.repeatUsage * repeatUsage +
      w.growthMomentum * growthMomentum) *
    100;

  let trend: TerritoryDomination["trend"] = "flat";
  if (m.growthRate > 0.06) trend = "up";
  else if (m.growthRate < -0.02) trend = "down";

  const biggestStrength =
    penetrationAvg > 0.55
      ? "Cross-hub penetration depth"
      : m.revenueCents > 300_000_000
        ? "Revenue contribution cluster"
        : "Demand density relative to footprint";

  const biggestWeakness =
    m.supplyDemandRatio < 0.85
      ? "Supply coverage vs demand"
      : m.conversionRate < 0.14
        ? "Conversion efficiency"
        : "Operational bench vs opportunity";

  return {
    territoryId: t.id,
    score: Math.round(Math.max(0, Math.min(100, score))),
    trend,
    biggestWeakness,
    biggestStrength,
  };
}

export function buildStrategicRecommendations(
  prioritized: ReturnType<typeof prioritizeMarkets>,
  gaps: MarketGap[]
): StrategicRecommendation[] {
  const out: StrategicRecommendation[] = [];
  let i = 0;

  function actionForHub(h: HubType, rank: number): string {
    switch (h) {
      case "BNHUB":
        return rank <= 3
          ? "Boost BNHub inventory and host incentives"
          : "Pilot BNHub supply sprint with measurable listing targets";
      case "BROKER":
        return "Increase broker acquisition and onboarding coverage";
      case "INVESTOR":
        return "Focus investor marketing and diligence-ready inventory";
      case "RESIDENCE":
        return "Recruit residence-services operators adjacent to stays demand";
      case "BUYER":
        return "Deploy sales effort on buyer routing and conversion";
      case "SELLER":
        return "Recruit listings supply and seller-side campaigns";
      default:
        return "Coordinate multi-hub push";
    }
  }

  for (const p of prioritized.slice(0, 8)) {
    const hub = p.targetHubs[0] ?? "BUYER";
    const gap = gaps.find((g) => g.territoryId === p.territoryId);

    out.push({
      id: `rec-${p.territoryId}-${i++}`,
      action: actionForHub(hub, p.rank),
      territoryId: p.territoryId,
      targetHub: hub,
      expectedImpact: p.rank <= 3 ? "high" : p.priorityScore > 0.48 ? "medium" : "low",
      urgency: gap?.severity === "critical" ? "high" : p.rank <= 4 ? "medium" : "low",
      confidence: clamp01(0.45 + p.priorityScore * 0.35),
      explanation: `${p.territoryName}: ${p.whyNow} Push via ${hub} (${p.targetHubs.join(", ")}).`,
    });
  }

  for (const g of gaps.filter((x) => x.severity === "critical").slice(0, 3)) {
    const hubFromGap = gapTypeToHub(g.gapType);
    out.push({
      id: `rec-gap-${g.id}-${i++}`,
      action: g.recommendedNextMove.slice(0, 120),
      territoryId: g.territoryId,
      targetHub: hubFromGap,
      expectedImpact: "high",
      urgency: "high",
      confidence: 0.55,
      explanation: `Gap-driven: ${g.gapType.replace(/_/g, " ").toLowerCase()} — ${g.whyItMatters}`,
    });
  }

  return out.slice(0, 14);
}

function gapTypeToHub(gapType: GapType): HubType {
  switch (gapType) {
    case "BNHUB_LOW_INVENTORY":
      return "BNHUB";
    case "BROKER_UNDERREPRESENTED":
      return "BROKER";
    case "INVESTOR_INTEREST_WEAK_INVENTORY":
      return "INVESTOR";
    case "RESIDENCE_DEMAND_LOW_SUPPLY":
      return "RESIDENCE";
    case "HIGH_DEMAND_LOW_SUPPLY":
      return "SELLER";
    case "TRAFFIC_WEAK_CONVERSION":
      return "BUYER";
    default:
      return "BUYER";
  }
}

export type MarketDominationAlert = {
  id: string;
  kind: "priority_territory" | "score_drop" | "demand_supply" | "competitor_pressure" | "expansion_ready";
  title: string;
  body: string;
  territoryId?: string;
  severity: "watch" | "important" | "critical";
};

export function buildMarketDominationAlerts(
  territories: Territory[],
  dominationById: Record<string, TerritoryDomination>,
  readinessById: Record<string, ReturnType<typeof scoreExpansionReadiness>>,
  competitorViews: Record<string, ReturnType<typeof buildCompetitorPressureView>>,
  gaps: MarketGap[]
): MarketDominationAlert[] {
  const alerts: MarketDominationAlert[] = [];
  const prevState = loadDominationState();
  const prev = prevState.lastDominationScores;
  const prevBands = prevState.lastReadinessBand ?? {};

  for (const t of territories) {
    const d = dominationById[t.id];
    const r = readinessById[t.id];
    if (r?.band === "PRIORITY") {
      alerts.push({
        id: `alt-pri-${t.id}`,
        kind: "priority_territory",
        title: `${t.name} marked PRIORITY for expansion`,
        body: r.recommendedEntryStrategy,
        territoryId: t.id,
        severity: "important",
      });
    }

    if (prev[t.id] != null && d && prev[t.id]! - d.score >= 12) {
      alerts.push({
        id: `alt-drop-${t.id}`,
        kind: "score_drop",
        title: `Domination score slipped in ${t.name}`,
        body: `Previously ~${prev[t.id]} → now ${d.score}. Review supply + conversion drivers.`,
        territoryId: t.id,
        severity: "important",
      });
    }

    const cp = competitorViews[t.id];
    if (cp && cp.pressureScore >= 8) {
      alerts.push({
        id: `alt-cmp-${t.id}`,
        kind: "competitor_pressure",
        title: `High competitor pressure — ${t.name}`,
        body: "Logged incumbents strong — pair pushes with differentiated BNHub + broker routing.",
        territoryId: t.id,
        severity: "watch",
      });
    }

    if (r) {
      const prior = prevBands[t.id];
      if (
        prior != null &&
        readinessRank(r.band) >= readinessRank("READY") &&
        readinessRank(prior) < readinessRank("READY")
      ) {
        alerts.push({
          id: `alt-ready-${t.id}`,
          kind: "expansion_ready",
          title: `${t.name} is now expansion-ready or better`,
          body: "Readiness band moved up — consider staged expansion with weekly KPI reviews.",
          territoryId: t.id,
          severity: "watch",
        });
      }
    }
  }

  for (const g of gaps.filter((x) => x.severity === "critical")) {
    alerts.push({
      id: `alt-gap-${g.id}`,
      kind: "demand_supply",
      title: `Gap: ${g.gapType.replace(/_/g, " ")}`,
      body: g.whyItMatters,
      territoryId: g.territoryId,
      severity: "critical",
    });
  }

  const nextScores: Record<string, number> = { ...prev };
  for (const t of territories) {
    const d = dominationById[t.id];
    if (d) nextScores[t.id] = d.score;
  }
  saveDominationState({ lastDominationScores: nextScores });

  return alerts.slice(0, 40);
}

export type TerritoryTrendPoint = { period: string; score: number };

export function buildSyntheticTrendHistory(t: Territory, dominationScore: number): TerritoryTrendPoint[] {
  const g = t.metrics.growthRate;
  return [
    { period: "T-90d", score: Math.round(dominationScore * (0.92 - g)) },
    { period: "T-60d", score: Math.round(dominationScore * (0.96 - g * 0.5)) },
    { period: "T-30d", score: Math.round(dominationScore * (0.99 - g * 0.25)) },
    { period: "Now", score: dominationScore },
  ];
}

export type MarketDominationSnapshot = {
  territories: Territory[];
  penetrationByTerritory: Record<string, ReturnType<typeof computeHubPenetration>>;
  dominationByTerritory: Record<string, TerritoryDomination>;
  readinessByTerritory: Record<string, ReturnType<typeof scoreExpansionReadiness>>;
  competitorByTerritory: Record<string, ReturnType<typeof buildCompetitorPressureView>>;
  gaps: MarketGap[];
  prioritized: ReturnType<typeof prioritizeMarkets>;
  recommendations: StrategicRecommendation[];
  alerts: MarketDominationAlert[];
  generatedAtIso: string;
};

export function buildMarketDominationSnapshot(): MarketDominationSnapshot {
  ensureDemoCompetitors();
  const territories = loadTerritories();
  const penetrationByTerritory: MarketDominationSnapshot["penetrationByTerritory"] = {};
  const dominationByTerritory: Record<string, TerritoryDomination> = {};
  const readinessByTerritory: Record<string, ReturnType<typeof scoreExpansionReadiness>> = {};
  const competitorByTerritory: Record<string, ReturnType<typeof buildCompetitorPressureView>> = {};

  for (const t of territories) {
    const pen = computeHubPenetration(t.metrics);
    penetrationByTerritory[t.id] = pen;
    const avgPen = pen.reduce((s, p) => s + p.score, 0) / pen.length;
    dominationByTerritory[t.id] = computeTerritoryDomination(t, avgPen);
    readinessByTerritory[t.id] = scoreExpansionReadiness(t);
    competitorByTerritory[t.id] = buildCompetitorPressureView(t, competitorsForTerritory(t.id));
  }

  const gaps = analyzeMarketGaps(territories);
  const prioritized = prioritizeMarkets(
    territories,
    readinessByTerritory,
    dominationByTerritory,
    competitorByTerritory
  );
  const recommendations = buildStrategicRecommendations(prioritized, gaps);
  const alerts = buildMarketDominationAlerts(
    territories,
    dominationByTerritory,
    readinessByTerritory,
    competitorByTerritory,
    gaps
  );

  return {
    territories,
    penetrationByTerritory,
    dominationByTerritory,
    readinessByTerritory,
    competitorByTerritory,
    gaps,
    prioritized,
    recommendations,
    alerts,
    generatedAtIso: new Date().toISOString(),
  };
}

export function getTerritoryDetail(territoryId: string): {
  territory: Territory | null;
  penetration: ReturnType<typeof computeHubPenetration>;
  domination: TerritoryDomination | null;
  readiness: ReturnType<typeof scoreExpansionReadiness> | null;
  competitor: ReturnType<typeof buildCompetitorPressureView> | null;
  explainability: ReturnType<typeof explainTerritoryScore> | null;
  trendHistory: TerritoryTrendPoint[];
  gaps: MarketGap[];
} | null {
  const t = loadTerritories().find((x) => x.id === territoryId);
  if (!t) return null;
  const pen = computeHubPenetration(t.metrics);
  const avgPen = pen.reduce((s, p) => s + p.score, 0) / pen.length;
  const dom = computeTerritoryDomination(t, avgPen);
  const readiness = scoreExpansionReadiness(t);
  const competitor = buildCompetitorPressureView(t, competitorsForTerritory(t.id));
  const explainability = explainTerritoryScore(t, dom, pen);
  const gaps = analyzeMarketGaps([t]).filter((g) => g.territoryId === t.id);
  const trendHistory = buildSyntheticTrendHistory(t, dom.score);

  return {
    territory: t,
    penetration: pen,
    domination: dom,
    readiness,
    competitor,
    explainability,
    trendHistory,
    gaps,
  };
}

/** Seed demo competitors once if store empty */
export function ensureDemoCompetitors(): void {
  if (listCompetitors().length > 0) return;
  upsertCompetitor({
    name: "Legacy Portal A",
    territoryId: "mtl-core",
    category: "LISTING_PLATFORM",
    perceivedStrength: 8,
    opportunityNotes: "Cold lead dependency — attack with routed intent narrative",
  });
  upsertCompetitor({
    name: "STR Marketplace B",
    territoryId: "old-mtl",
    category: "SHORT_TERM_RENTAL",
    perceivedStrength: 6,
    notes: "Strong weekend compression",
  });
}
