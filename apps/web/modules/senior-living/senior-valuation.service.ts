/**
 * Simple ARR × multiplier valuation for investor storytelling (not a formal 409A).
 */

export type SeniorMarketValuationInputs = {
  /** Annual recurring revenue in USD (or primary reporting currency). */
  arrUsd: number;
  /** Month-over-month revenue growth, e.g. 0.12 = 12%. */
  monthlyGrowthRate: number;
  /** Revenue retention / net dollar retention proxy 0–1. */
  retentionRate: number;
  /** Pipeline conversion proxy 0–1 (won / qualified). */
  conversionRate: number;
  /** Share of roadmap cities that are ACTIVE or DOMINANT (0–1). */
  expansionProgress: number;
};

export type SeniorMarketValuationResult = {
  arrUsd: number;
  baseMultiplier: number;
  multiplier: number;
  valuationUsd: number;
  adjustments: Array<{ label: string; delta: number }>;
};

const MIN_MULTIPLIER = 4;
const MAX_MULTIPLIER = 12;

export function computeSeniorMarketValuation(inputs: SeniorMarketValuationInputs): SeniorMarketValuationResult {
  const adjustments: Array<{ label: string; delta: number }> = [];
  let m = 6;

  if (inputs.monthlyGrowthRate >= 0.15) {
    adjustments.push({ label: "Strong MoM growth (≥15%)", delta: 1.25 });
    m += 1.25;
  } else if (inputs.monthlyGrowthRate >= 0.08) {
    adjustments.push({ label: "Healthy MoM growth (≥8%)", delta: 0.75 });
    m += 0.75;
  } else if (inputs.monthlyGrowthRate >= 0.03) {
    adjustments.push({ label: "Positive MoM growth", delta: 0.35 });
    m += 0.35;
  }

  if (inputs.retentionRate >= 0.9) {
    adjustments.push({ label: "Retention ≥90%", delta: 0.75 });
    m += 0.75;
  } else if (inputs.retentionRate >= 0.8) {
    adjustments.push({ label: "Retention ≥80%", delta: 0.35 });
    m += 0.35;
  }

  if (inputs.conversionRate >= 0.2) {
    adjustments.push({ label: "Conversion strength", delta: 0.5 });
    m += 0.5;
  } else if (inputs.conversionRate >= 0.12) {
    adjustments.push({ label: "Solid conversion", delta: 0.25 });
    m += 0.25;
  }

  if (inputs.expansionProgress >= 0.4) {
    adjustments.push({ label: "Multi-city expansion execution", delta: 0.75 });
    m += 0.75;
  } else if (inputs.expansionProgress >= 0.15) {
    adjustments.push({ label: "Early market expansion", delta: 0.35 });
    m += 0.35;
  }

  const multiplier = Math.min(MAX_MULTIPLIER, Math.max(MIN_MULTIPLIER, Math.round(m * 10) / 10));
  const valuationUsd = Math.round(inputs.arrUsd * multiplier);

  return {
    arrUsd: inputs.arrUsd,
    baseMultiplier: 6,
    multiplier,
    valuationUsd,
    adjustments:
      adjustments.length > 0 ? adjustments : [{ label: "Baseline SaaS multiple band", delta: multiplier - 6 }],
  };
}
