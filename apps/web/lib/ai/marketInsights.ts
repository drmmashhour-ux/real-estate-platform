import type { DemandHeatmapRow } from "@/lib/market/demandHeatmap";

export type MarketInsightType = "rising_demand" | "high_conversion" | "low_conversion";

/** Which raw heatmap field backs the insight (orchestrator + explainability). */
export type InsightMetric = "trend" | "conversionRate" | "views";

export type InsightConfidence = "high" | "medium" | "low";

export type MarketInsight = {
  type: MarketInsightType;
  city: string;
  metric: InsightMetric;
  /** Raw metric value from the heatmap row (same units as heatmap). */
  value: number;
  message: string;
  confidence: InsightConfidence;
  /**
   * City-level booking trend from heatmap (`DemandHeatmapRow.trend`); included so lists can be
   * sorted across mixed `metric` types (orchestrator / UI prioritization).
   */
  contextTrend: number;
};

/** Execution-oriented type for orchestrator routing (e.g. `price_increase` → pricing pipeline). */
export type MarketActionExecutionType = "price_increase" | "increase_supply" | "improve_listings";

export type ActionPriority = "high" | "medium" | "low";

export type MarketAction = {
  type: MarketActionExecutionType;
  city: string;
  suggestion: string;
  priority: ActionPriority;
  /** Source insight type (audit / learning / `logInsightOutcome`). */
  reason: MarketInsightType;
  /** Optional heuristic range signal for pricing / supply decisions. */
  estimatedImpact?: {
    revenueIncreasePct?: number;
    confidence: InsightConfidence;
  };
};

function insightConfidenceFor(
  kind: MarketInsightType,
  r: DemandHeatmapRow
): InsightConfidence {
  if (kind === "rising_demand") {
    if (r.trend > 0.2) return "high";
    if (r.trend > 0.1) return "medium";
    return "low";
  }
  if (kind === "high_conversion") {
    if (r.conversionRate > 0.12) return "high";
    if (r.conversionRate > 0.08) return "medium";
    return "low";
  }
  if (kind === "low_conversion") {
    if (r.views > 500) return "high";
    if (r.views > 200) return "medium";
    return "low";
  }
  return "low";
}

function actionPriorityFor(kind: MarketInsightType, r: DemandHeatmapRow): ActionPriority {
  if (kind === "rising_demand") {
    if (r.trend > 0.2) return "high";
    if (r.trend > 0.1) return "medium";
    return "low";
  }
  if (kind === "high_conversion") {
    if (r.conversionRate > 0.12) return "high";
    if (r.conversionRate > 0.08) return "medium";
    return "low";
  }
  if (kind === "low_conversion") {
    if (r.views > 500) return "high";
    if (r.views > 200) return "medium";
    return "low";
  }
  return "low";
}

function priceIncreaseImpact(r: DemandHeatmapRow, confidence: InsightConfidence): MarketAction["estimatedImpact"] {
  const base = 5 + Math.min(0.2, r.trend) * 35;
  const revenueIncreasePct = Math.round(Math.min(12, Math.max(5, base)));
  return {
    revenueIncreasePct,
    confidence,
  };
}

const PRI_ORDER: Record<ActionPriority, number> = { high: 0, medium: 1, low: 2 };

/**
 * Rule-based pattern detection on normalized demand heatmap rows.
 */
export function detectMarketInsights(rows: DemandHeatmapRow[]): MarketInsight[] {
  const insights: MarketInsight[] = [];

  for (const r of rows) {
    if (r.trend > 0.1) {
      const confidence = insightConfidenceFor("rising_demand", r);
      insights.push({
        type: "rising_demand",
        city: r.city,
        metric: "trend",
        value: r.trend,
        message: `Demand is increasing in ${r.city}`,
        confidence,
        contextTrend: r.trend,
      });
    }

    if (r.conversionRate > 0.08) {
      const confidence = insightConfidenceFor("high_conversion", r);
      insights.push({
        type: "high_conversion",
        city: r.city,
        metric: "conversionRate",
        value: r.conversionRate,
        message: `${r.city} has strong booking conversion`,
        confidence,
        contextTrend: r.trend,
      });
    }

    if (r.conversionRate < 0.02 && r.views > 100) {
      const confidence = insightConfidenceFor("low_conversion", r);
      insights.push({
        type: "low_conversion",
        city: r.city,
        metric: "views",
        value: r.views,
        message: `${r.city} has high traffic but low bookings`,
        confidence,
        contextTrend: r.trend,
      });
    }
  }

  insights.sort((a, b) => b.contextTrend - a.contextTrend);
  return insights;
}

/**
 * Map insights to actions with priority, reason, and optional impact (additive / orchestrator-safe).
 */
export function generateMarketActions(
  insights: MarketInsight[],
  rowsByCity: Map<string, DemandHeatmapRow>
): MarketAction[] {
  const out: MarketAction[] = [];

  for (const i of insights) {
    const r = rowsByCity.get(i.city);
    if (!r) continue;
    const priority = actionPriorityFor(i.type, r);

    if (i.type === "rising_demand") {
      out.push({
        type: "price_increase",
        city: i.city,
        suggestion: "Increase prices by 5–10%",
        priority,
        reason: "rising_demand",
        estimatedImpact: priceIncreaseImpact(r, i.confidence),
      });
    } else if (i.type === "high_conversion") {
      out.push({
        type: "increase_supply",
        city: i.city,
        suggestion: "Add more listings in this city",
        priority,
        reason: "high_conversion",
        estimatedImpact: { confidence: i.confidence },
      });
    } else if (i.type === "low_conversion") {
      out.push({
        type: "improve_listings",
        city: i.city,
        suggestion: "Improve photos or pricing",
        priority,
        reason: "low_conversion",
        estimatedImpact: { confidence: i.confidence },
      });
    }
  }

  out.sort((a, b) => PRI_ORDER[a.priority] - PRI_ORDER[b.priority]);
  return out;
}

/** Build a city key → row map for action generation. */
export function indexHeatmapByCity(rows: DemandHeatmapRow[]): Map<string, DemandHeatmapRow> {
  const m = new Map<string, DemandHeatmapRow>();
  for (const r of rows) m.set(r.city, r);
  return m;
}

export type CityMarketGroup = {
  city: string;
  insights: MarketInsight[];
  actions: MarketAction[];
};

/**
 * Group insights and actions for city-scoped UIs; cities sorted A–Z for stable layout.
 */
export function groupMarketInsightsByCity(
  insights: MarketInsight[],
  actions: MarketAction[]
): CityMarketGroup[] {
  const citySet = new Set<string>();
  for (const i of insights) citySet.add(i.city);
  for (const a of actions) citySet.add(a.city);
  return [...citySet]
    .sort((a, b) => a.localeCompare(b, undefined, { sensitivity: "base" }))
    .map((city) => ({
      city,
      insights: insights.filter((i) => i.city === city),
      actions: actions.filter((a) => a.city === city),
    }))
    .filter((g) => g.insights.length + g.actions.length > 0);
}
