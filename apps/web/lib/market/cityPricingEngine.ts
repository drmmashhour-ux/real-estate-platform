import { flags } from "@/lib/flags";
import { buildActionsForRow, getSoftPricingBiasPercent, demandBandFromScore } from "@/lib/market/demandActions";
import { getDemandHeatmap } from "@/lib/market/demandHeatmap";

/**
 * What to recommend for nightly pricing in a city, based on demand heatmap data.
 * Does **not** read or update listing prices — decision support only. Any future
 * automatic execution would require a separate, explicitly gated service + approval flow.
 */
export type CityPricingRecommendation = {
  city: string;
  /** Same composite as `getDemandHeatmap().demandScore` (per-listing–normalized; see heatmap). */
  demandScore: number;
  views: number;
  bookings: number;
  /** Order 83 — 7d booking trend (fraction). */
  trend: number;
  /** Human-readable band for admin. */
  demandBand: "HIGH" | "MEDIUM" | "LOW";
  /** Action keys from `demandActions` (e.g. `increase_prices`, `add_supply`). */
  demandActions: string[];
  recommendation: "increase_price" | "decrease_price" | "keep_price";
  suggestedAdjustmentPercent: number;
  reason: string;
};

const SUGGESTED_ADJ_MIN = -15;
const SUGGESTED_ADJ_MAX = 25;

function clampCitySuggestedPct(raw: number): number {
  return Math.min(SUGGESTED_ADJ_MAX, Math.max(SUGGESTED_ADJ_MIN, Math.round(raw)));
}

/**
 * Autonomous (rule-based) city-level price **recommendations** for BNHub / LECIPM.
 * Does not write to the database or change listing `nightPriceCents` — recommendations only.
 */
export async function getCityPricingRecommendations(): Promise<CityPricingRecommendation[]> {
  if (!flags.AI_PRICING) {
    return [];
  }
  const heatmap = await getDemandHeatmap();
  if (heatmap.length === 0) {
    return [];
  }

  const out: CityPricingRecommendation[] = [];

  for (const row of heatmap) {
    const { city, demandScore, views, bookings, trend } = row;
    const demandActions = buildActionsForRow(row);
    const actionBias = getSoftPricingBiasPercent(demandActions);
    const demandBand = demandBandFromScore(demandScore);

    let basePct: number;
    let recommendation: CityPricingRecommendation["recommendation"];
    let baseReason: string;

    if (demandScore >= 100) {
      recommendation = "increase_price";
      basePct = 10;
      baseReason = "High demand detected from views and bookings.";
    } else if (demandScore >= 50) {
      recommendation = "increase_price";
      basePct = 5;
      baseReason = "Moderate demand growth detected.";
    } else if (demandScore <= 10) {
      recommendation = "decrease_price";
      basePct = -5;
      baseReason = "Low demand detected; price reduction may improve conversion.";
    } else {
      recommendation = "keep_price";
      basePct = 0;
      baseReason = "Demand is stable; no pricing change recommended.";
    }

    const suggestedAdjustmentPercent = clampCitySuggestedPct(basePct + actionBias);
    const reason =
      actionBias !== 0
        ? `${baseReason} Order 83 soft bias from demand actions: ${actionBias > 0 ? "+" : ""}${actionBias}%. (Does not change stored prices.)`
        : baseReason;

    out.push({
      city,
      demandScore,
      views,
      bookings,
      trend,
      demandBand,
      demandActions,
      recommendation,
      suggestedAdjustmentPercent,
      reason,
    });
  }

  return out.sort((a, b) => b.demandScore - a.demandScore);
}
