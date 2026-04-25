import type { GreenEngineInput } from "@/modules/green/green.types";
import type { QuebecEsgRecommendation } from "./quebec-esg-recommendation.service";
import {
  QUEBEC_ESG_INCENTIVES_CATALOG,
  type QuebecEsgIncentiveCatalogEntry,
} from "./quebec-esg-incentives.catalog";
import { greenAiLog } from "./green-ai-logger";

export type QuebecEsgIncentiveEstimateRow = {
  recommendationKey: string;
  programKey: string;
  title: string;
  status: "active" | "conditional" | "closed";
  estimatedAmount: number | null;
  estimatedAmountLow: number | null;
  estimatedAmountHigh: number | null;
  eligibilitySummary: string;
  disclaimer: string;
};

export type QuebecEsgIncentiveEstimateResult = {
  incentives: QuebecEsgIncentiveEstimateRow[];
  totalEstimatedIncentives: number | null;
};

const RECO_TO_CATEGORIES: Record<string, string[]> = {
  upgrade_attic_insulation: ["attic_insulation", "wall_insulation"],
  install_triple_glazed_windows: ["windows"],
  replace_heating_heat_pump: ["heat_pump", "heating_conversion"],
  improve_airtightness: ["ventilation", "wall_insulation"],
  sustainable_materials_retro: [],
  water_saving_fixtures: [],
  solar_or_green_roof: ["solar", "green_roof"],
};

function entryMatchesRecommendation(entry: QuebecEsgIncentiveCatalogEntry, recKey: string): boolean {
  const cats = RECO_TO_CATEGORIES[recKey] ?? [];
  if (cats.length === 0) return false;
  return entry.relatedRetrofitCategories.some((c) => cats.includes(c));
}

function estimateAmountForEntry(
  entry: QuebecEsgIncentiveCatalogEntry,
  recKey: string,
  input: GreenEngineInput,
): { single: number | null; low: number | null; high: number | null; note: string } {
  if (entry.status === "closed") {
    return { single: null, low: null, high: null, note: "Program closed — no current assistance modeled." };
  }
  if (entry.amountType === "informational" || entry.amountValue == null) {
    return {
      single: null,
      low: null,
      high: null,
      note: "Amount not modeled; eligibility and benefits must be verified with the official program.",
    };
  }
  if (entry.key === "renoclimat_windows_doors_per_opening") {
    const roughOpenings = input.surfaceSqft != null && input.surfaceSqft > 0 ? Math.max(3, Math.min(18, Math.round(input.surfaceSqft / 650))) : null;
    if (roughOpenings == null) {
      return {
        single: null,
        low: entry.amountValue * 4,
        high: entry.amountValue * 12,
        note: "Rough opening count unknown — scaled using illustrative 4–12 openings; verify with evaluation.",
      };
    }
    const total = entry.amountValue * roughOpenings;
    return {
      single: total,
      low: Math.round(total * 0.85),
      high: Math.round(total * 1.15),
      note: `Illustrative: ${roughOpenings} rough openings × ${entry.amountValue} CAD (verify cap rules).`,
    };
  }
  if (entry.amountType === "fixed" && entry.amountValue != null) {
    return { single: entry.amountValue, low: entry.amountValue, high: entry.amountValue, note: "Published fixed tier from catalog — confirm on official rate sheet." };
  }
  if (entry.amountRange) {
    return {
      single: null,
      low: entry.amountRange.low,
      high: entry.amountRange.high,
      note: "Range from catalog — confirm eligibility caps.",
    };
  }
  return { single: null, low: null, high: null, note: "No amount encoded." };
}

/**
 * Maps recommendations to catalog programs only. Does not stack duplicate programs for multiple recs (conservative total).
 */
export function estimateQuebecEsgIncentives(
  recommendations: QuebecEsgRecommendation[],
  input: GreenEngineInput,
  options?: { historyMode?: boolean },
): QuebecEsgIncentiveEstimateResult {
  try {
    const historyMode = options?.historyMode === true;
    const incentives: QuebecEsgIncentiveEstimateRow[] = [];
    const usedProgramKeys = new Set<string>();

    for (const rec of recommendations) {
      for (const entry of QUEBEC_ESG_INCENTIVES_CATALOG) {
        if (!entryMatchesRecommendation(entry, rec.key)) continue;
        if (entry.status === "closed" && !historyMode) continue;

        if (usedProgramKeys.has(entry.key)) continue;
        usedProgramKeys.add(entry.key);

        const amt = estimateAmountForEntry(entry, rec.key, input);
        incentives.push({
          recommendationKey: rec.key,
          programKey: entry.key,
          title: entry.title,
          status: entry.status === "closed" ? "closed" : entry.status === "conditional" ? "conditional" : "active",
          estimatedAmount: amt.single,
          estimatedAmountLow: amt.low,
          estimatedAmountHigh: amt.high,
          eligibilitySummary: `${entry.eligibilitySummary} ${amt.note}`.trim(),
          disclaimer: entry.disclaimer,
        });
      }
    }

    let total: number | null = 0;
    let uncertain = false;
    for (const row of incentives) {
      if (row.status === "closed" && !historyMode) continue;
      const v = row.estimatedAmount;
      if (v != null && Number.isFinite(v)) {
        total! += v;
      } else if (row.estimatedAmountLow != null && row.estimatedAmountHigh != null) {
        total! += (row.estimatedAmountLow + row.estimatedAmountHigh) / 2;
        uncertain = true;
      } else {
        uncertain = true;
      }
    }
    if (incentives.length === 0) {
      total = null;
    } else if (uncertain) {
      total = null;
    }

    greenAiLog.info("quebec_esg_incentives_estimated", {
      rows: incentives.length,
      totalEstimated: total,
      historyMode,
    });

    return { incentives, totalEstimatedIncentives: total };
  } catch {
    greenAiLog.warn("quebec_esg_incentives_estimate_failed", { ok: false });
    return { incentives: [], totalEstimatedIncentives: null };
  }
}
