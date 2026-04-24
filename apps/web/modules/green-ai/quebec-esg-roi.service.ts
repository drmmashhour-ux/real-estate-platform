import type { QuebecEsgCostEstimateResult } from "./quebec-esg-cost.service";
import type { QuebecEsgIncentiveEstimateResult } from "./quebec-esg-incentive.service";
import { greenAiLog } from "./green-ai-logger";

export type QuebecEsgRetrofitRoiParams = {
  currentEvaluationScore: number;
  projectedEvaluationScore: number;
  costEstimates: QuebecEsgCostEstimateResult;
  incentiveEstimates: QuebecEsgIncentiveEstimateResult;
  /** Listing ask or assessed value — optional, for narrative only */
  optionalListingPriceCad?: number | null;
  propertyType?: string | null;
};

export type QuebecEsgRetrofitRoiResult = {
  netCostLow: number | null;
  netCostHigh: number | null;
  scoreDelta: number;
  simpleRoiNarrative: string[];
  resaleImpactScenario: {
    conservative: string[];
    neutral: string[];
    optimistic: string[];
  };
  paybackNotes: string[];
};

function safeNet(
  lowCost: number | null,
  highCost: number | null,
  incentiveMid: number | null,
  incentiveLow: number | null,
  incentiveHigh: number | null,
): { netLow: number | null; netHigh: number | null } {
  if (lowCost == null || highCost == null) {
    return { netLow: null, netHigh: null };
  }
  if (incentiveMid != null && Number.isFinite(incentiveMid)) {
    return {
      netLow: Math.max(0, lowCost - incentiveMid * 1.1),
      netHigh: Math.max(0, highCost - incentiveMid * 0.85),
    };
  }
  if (incentiveLow != null && incentiveHigh != null) {
    const mid = (incentiveLow + incentiveHigh) / 2;
    return {
      netLow: Math.max(0, lowCost - incentiveHigh),
      netHigh: Math.max(0, highCost - incentiveLow),
    };
  }
  return { netLow: lowCost, netHigh: highCost };
}

/**
 * Scenario-based, non-precise ROI framing — no guaranteed resale %.
 */
export function calculateQuebecEsgRetrofitRoi(params: QuebecEsgRetrofitRoiParams): QuebecEsgRetrofitRoiResult {
  try {
    const scoreDelta = Math.round(params.projectedEvaluationScore - params.currentEvaluationScore);
    const inc = params.incentiveEstimates;
    let incentiveMid = inc.totalEstimatedIncentives;
    let incentiveLow: number | null = null;
    let incentiveHigh: number | null = null;
    if (incentiveMid == null && inc.incentives.length > 0) {
      const lows = inc.incentives.map((r) => r.estimatedAmountLow).filter((x): x is number => x != null);
      const highs = inc.incentives.map((r) => r.estimatedAmountHigh).filter((x): x is number => x != null);
      const singles = inc.incentives.map((r) => r.estimatedAmount).filter((x): x is number => x != null);
      if (lows.length && highs.length) {
        incentiveLow = lows.reduce((a, b) => a + b, 0);
        incentiveHigh = highs.reduce((a, b) => a + b, 0);
        incentiveMid = (incentiveLow + incentiveHigh) / 2;
      } else if (singles.length) {
        incentiveMid = singles.reduce((a, b) => a + b, 0);
      }
    }

    const { netLow, netHigh } = safeNet(
      params.costEstimates.totalLowCost,
      params.costEstimates.totalHighCost,
      incentiveMid,
      incentiveLow,
      incentiveHigh,
    );

    const simpleRoiNarrative: string[] = [
      `Illustrative score change: about ${scoreDelta > 0 ? "+" : ""}${scoreDelta} points on the internal Québec-inspired scale (not an official label).`,
      "Net cost after modeled incentives is uncertain until programs confirm eligibility and caps.",
    ];
    if (netLow != null && netHigh != null) {
      simpleRoiNarrative.push(
        `Rough net spend band (after illustrative incentives): ~${Math.round(netLow).toLocaleString("en-CA")}–${Math.round(netHigh).toLocaleString("en-CA")} CAD.`,
      );
    } else {
      simpleRoiNarrative.push("Insufficient data for a net-cost band — use contractor quotes and official program letters.");
    }

    const price = params.optionalListingPriceCad;
    const conservative: string[] = [
      "Energy upgrades may improve comfort and operating cost story; resale premium is not guaranteed.",
      "Buyers may discount unclear retrofit documentation — keep evaluations and invoices organized.",
    ];
    const neutral: string[] = [
      "Stronger energy narrative can improve marketability versus similar listings in the same segment.",
      "Listing positioning can highlight efficiency without promising a specific price lift.",
    ];
    const optimistic: string[] = [
      "In competitive buyer pools, credible efficiency upgrades can support stronger buyer appeal.",
      "Pair upgrades with third-party documentation where possible to reduce buyer uncertainty.",
    ];
    if (price != null && price > 0) {
      conservative.push("Do not impute a percentage return from list price — market-specific.");
      neutral.push("Use list price only as context; buyer willingness to pay varies by sub-market.");
      optimistic.push("Well-presented efficiency story may help justify asking strategy with professional pricing advice.");
    }

    const paybackNotes: string[] = [
      "Simple payback depends on energy prices, occupancy, and actual installed cost — not computed as a precise year count here.",
      "Prefer utility savings modeling from an energy advisor over app-generated payback.",
    ];

    greenAiLog.info("quebec_esg_roi_calculated", {
      scoreDelta,
      hasNetBand: netLow != null,
    });

    return {
      netCostLow: netLow,
      netCostHigh: netHigh,
      scoreDelta,
      simpleRoiNarrative,
      resaleImpactScenario: { conservative, neutral, optimistic },
      paybackNotes,
    };
  } catch {
    greenAiLog.warn("quebec_esg_roi_calculated", { ok: false });
    return {
      netCostLow: null,
      netCostHigh: null,
      scoreDelta: Math.round(params.projectedEvaluationScore - params.currentEvaluationScore),
      simpleRoiNarrative: ["ROI narrative unavailable — insufficient or invalid inputs."],
      resaleImpactScenario: { conservative: [], neutral: [], optimistic: [] },
      paybackNotes: [],
    };
  }
}
