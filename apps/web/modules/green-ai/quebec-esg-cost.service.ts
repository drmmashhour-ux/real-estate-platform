import type { GreenEngineInput } from "@/modules/green/green.types";
import type { QuebecEsgRecommendation } from "./quebec-esg-recommendation.service";
import { greenAiLog } from "./green-ai-logger";

export type CostConfidence = "low" | "medium" | "high";

export type QuebecEsgCostEstimateRow = {
  recommendationKey: string;
  lowCost: number | null;
  highCost: number | null;
  confidence: CostConfidence;
  assumptions: string[];
};

export type QuebecEsgCostEstimateResult = {
  costEstimates: QuebecEsgCostEstimateRow[];
  totalLowCost: number | null;
  totalHighCost: number | null;
};

/** Internal CAD bands — illustrative, not market quotes. */
const BANDS = {
  attic_insulation: { low: 1_500, high: 6_000, conf: "medium" as const },
  wall_insulation: { low: 4_000, high: 18_000, conf: "low" as const },
  windows: { low: 8_000, high: 35_000, conf: "low" as const },
  heat_pump: { low: 10_000, high: 28_000, conf: "medium" as const },
  heating_conversion: { low: 12_000, high: 32_000, conf: "low" as const },
  ventilation: { low: 2_000, high: 8_500, conf: "medium" as const },
  solar: { low: 15_000, high: 45_000, conf: "low" as const },
  green_roof: { low: 25_000, high: 90_000, conf: "low" as const },
  generic_efficiency: { low: 2_500, high: 12_000, conf: "low" as const },
  materials: { low: 3_000, high: 15_000, conf: "low" as const },
  water: { low: 400, high: 2_500, conf: "high" as const },
} as const;

function categoriesForRecommendationKey(key: string): (keyof typeof BANDS)[] {
  switch (key) {
    case "upgrade_attic_insulation":
      return ["attic_insulation", "wall_insulation"];
    case "install_triple_glazed_windows":
      return ["windows"];
    case "replace_heating_heat_pump":
      return ["heat_pump", "heating_conversion"];
    case "improve_airtightness":
      return ["wall_insulation", "ventilation", "generic_efficiency"];
    case "sustainable_materials_retro":
      return ["materials"];
    case "water_saving_fixtures":
      return ["water"];
    case "solar_or_green_roof":
      return ["solar", "green_roof"];
    default:
      return ["generic_efficiency"];
  }
}

function widenForMissingData(
  low: number,
  high: number,
  conf: CostConfidence,
  input: GreenEngineInput,
): { low: number; high: number; confidence: CostConfidence; assumptions: string[] } {
  const assumptions: string[] = [
    "Rough retrofit-class bands in CAD; not a contractor quote.",
    "Excludes contingencies, premium finishes, and regional labour variance.",
  ];
  let c = conf;
  const sq = input.surfaceSqft;
  if (sq == null || !Number.isFinite(sq)) {
    assumptions.push("Living area unknown — range is intentionally wide.");
    c = "low";
    return { low: Math.round(low * 0.75), high: Math.round(high * 1.35), confidence: c, assumptions };
  }
  if (sq > 2800) {
    assumptions.push("Large footprint — upper end of band more likely.");
    return { low, high: Math.round(high * 1.12), confidence: c, assumptions };
  }
  if (sq < 900) {
    assumptions.push("Compact footprint — may land toward lower end of band.");
    return { low: Math.round(low * 0.9), high: Math.round(high * 0.95), confidence: c, assumptions };
  }
  return { low, high, confidence: c, assumptions };
}

function mergeBandForKeys(keys: (keyof typeof BANDS)[], input: GreenEngineInput): QuebecEsgCostEstimateRow {
  let low = 0;
  let high = 0;
  let worstConf: CostConfidence = "high";
  const confOrder: CostConfidence[] = ["low", "medium", "high"];
  const assumptions: string[] = [];

  for (const k of keys) {
    const b = BANDS[k];
    low += b.low;
    high += b.high;
    if (confOrder.indexOf(b.conf) < confOrder.indexOf(worstConf)) {
      worstConf = b.conf;
    }
    assumptions.push(`Includes ${k.replace(/_/g, " ")} band (${b.low.toLocaleString("en-CA")}–${b.high.toLocaleString("en-CA")} CAD).`);
  }

  const w = widenForMissingData(low, high, worstConf, input);
  return {
    recommendationKey: "",
    lowCost: w.low,
    highCost: w.high,
    confidence: w.confidence,
    assumptions: [...w.assumptions, ...assumptions],
  };
}

/**
 * Deterministic cost bands by retrofit category — not scraped pricing.
 */
export function estimateQuebecEsgUpgradeCosts(
  recommendations: QuebecEsgRecommendation[],
  input: GreenEngineInput,
): QuebecEsgCostEstimateResult {
  try {
    const costEstimates: QuebecEsgCostEstimateRow[] = [];
    for (const rec of recommendations) {
      const cats = categoriesForRecommendationKey(rec.key);
      const row = mergeBandForKeys(cats, input);
      row.recommendationKey = rec.key;
      row.assumptions = [`Recommendation: ${rec.title}`, ...row.assumptions];
      costEstimates.push(row);
    }

    let totalLow: number | null = 0;
    let totalHigh: number | null = 0;
    for (const r of costEstimates) {
      if (r.lowCost == null || r.highCost == null) {
        totalLow = null;
        totalHigh = null;
        break;
      }
      totalLow += r.lowCost;
      totalHigh += r.highCost;
    }

    greenAiLog.info("quebec_esg_costs_estimated", {
      rows: costEstimates.length,
      totalLow,
      totalHigh,
    });

    return { costEstimates, totalLowCost: totalLow, totalHighCost: totalHigh };
  } catch {
    greenAiLog.warn("quebec_esg_costs_estimate_failed", { ok: false });
    return { costEstimates: [], totalLowCost: null, totalHighCost: null };
  }
}
