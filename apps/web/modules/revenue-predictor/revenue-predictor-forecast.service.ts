import {
  COACHING_UPLIFT,
  CONFIDENCE_THRESHOLDS,
  RANGE_SPREAD,
  SCORE_INFLUENCE_WEIGHTS,
  STAGE_CLOSE_WEIGHT,
  TREND_MULTIPLIER_BOUNDS,
} from "./revenue-predictor.config";
import type {
  CoachingUpliftForecast,
  ForecastRangeCents,
  PipelineStage,
  SalespersonPredictorInput,
} from "./revenue-predictor.types";

const OPEN: PipelineStage[] = ["NEW_LEAD", "CONTACTED", "DEMO_SCHEDULED", "QUALIFIED", "OFFER"];

function clamp(n: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, n));
}

function historicalCloseRate(p: SalespersonPredictorInput): number {
  const d = p.closesWon + p.closesLost;
  if (d < 2) return 0.2;
  return clamp(p.closesWon / d, 0.05, 0.75);
}

function scoreModifier(p: SalespersonPredictorInput): number {
  const s =
    (p.averageCallScore - 65) * SCORE_INFLUENCE_WEIGHTS.callQuality +
    (p.averageControlScore - 65) * SCORE_INFLUENCE_WEIGHTS.control +
    (p.averageClosingScore - 65) * SCORE_INFLUENCE_WEIGHTS.closing +
    (p.trainingScore - 65) * SCORE_INFLUENCE_WEIGHTS.training +
    (p.objectionSuccessRate - 0.6) * 20 * SCORE_INFLUENCE_WEIGHTS.objectionHandling;
  return clamp(s, -0.1, 0.1);
}

function trendMultiplier(t: SalespersonPredictorInput["improvementTrend"]): number {
  if (t === "up") return clamp(1.04, TREND_MULTIPLIER_BOUNDS.up.min, TREND_MULTIPLIER_BOUNDS.up.max);
  if (t === "down") return 0.95;
  return 1;
}

function contextMultiplier(p: SalespersonPredictorInput): number {
  const s = p.seasonalityFactor ?? 1;
  const d = p.currentDemandSignal ?? 1;
  return clamp(s * d, 0.85, 1.12);
}

/**
 * Stage-weighted effective probability of converting current open pipeline to won revenue.
 */
export function effectiveStageCloseWeight(p: SalespersonPredictorInput): number {
  const stage = p.conversionByStage;
  let count = 0;
  for (const st of OPEN) {
    count += stage[st] ?? 0;
  }
  if (count < 1) {
    return 0.24;
  }
  let w = 0;
  for (const st of OPEN) {
    const c = stage[st] ?? 0;
    if (c <= 0) continue;
    w += (c / count) * STAGE_CLOSE_WEIGHT[st];
  }
  return clamp(w, 0.08, 0.72);
}

/**
 * Blends historical win rate with stage position and performance scores.
 */
export function computeWeightedCloseProbability(p: SalespersonPredictorInput): number {
  const h = historicalCloseRate(p);
  const sm = scoreModifier(p);
  const stW = effectiveStageCloseWeight(p);
  const blend = h * 0.45 + stW * 0.4 + 0.15 * (0.55 + sm);
  const t = trendMultiplier(p.improvementTrend);
  const ctx = contextMultiplier(p);
  return clamp(blend * t * ctx, 0.04, 0.78);
}

export function computeBaseExpectedRevenueCents(p: SalespersonPredictorInput, closeProb: number): number {
  if (p.pipelineValueCents <= 0) {
    const ad = p.averageDealValueCents;
    if (ad > 0 && p.currentOpenDeals > 0) {
      return Math.round(ad * p.currentOpenDeals * closeProb * 0.35);
    }
    return 0;
  }
  return Math.round(p.pipelineValueCents * closeProb);
}

export function buildForecastRangesCents(base: number): ForecastRangeCents {
  return {
    conservativeCents: Math.round(base * RANGE_SPREAD.conservative),
    baseCents: base,
    upsideCents: Math.round(base * RANGE_SPREAD.upside),
  };
}

export function buildCoachingUpliftForecast(
  p: SalespersonPredictorInput,
  baseExpectedCents: number,
): CoachingUpliftForecast {
  const gapClosing = Math.max(0, 72 - p.averageClosingScore);
  const gapObj = Math.max(0, 0.72 - p.objectionSuccessRate);
  const pctLift =
    clamp(
      gapClosing * COACHING_UPLIFT.scoreGapPerPointLift + gapObj * 12 * COACHING_UPLIFT.scoreGapPerPointLift,
      COACHING_UPLIFT.minUpliftPct,
      COACHING_UPLIFT.maxUpliftPct,
    );
  const uplift = Math.round(baseExpectedCents * pctLift);
  const bandLow = clamp(pctLift - 0.04, 0, COACHING_UPLIFT.maxUpliftPct);
  const bandHigh = clamp(pctLift + 0.04, COACHING_UPLIFT.minUpliftPct, COACHING_UPLIFT.maxUpliftPct + 0.05);

  let conf: CoachingUpliftForecast["confidenceLabel"] = "LOW";
  if (p.trainingScore >= 62 && p.totalCalls >= CONFIDENCE_THRESHOLDS.mediumMinCalls) conf = "MEDIUM";
  if (p.trainingScore >= 72 && p.totalCalls >= CONFIDENCE_THRESHOLDS.highMinCalls) conf = "HIGH";

  const narrative =
    pctLift <= COACHING_UPLIFT.minUpliftPct + 0.015
      ? "Coaching uplift modest — thicken pipeline or improve stage mix for bigger revenue leverage."
      : `Estimated revenue could improve roughly ${Math.round(bandLow * 100)}–${Math.round(bandHigh * 100)}% if closing mechanics and objection loops catch up (transparent score-gap model — not a guarantee).`;

  return {
    currentBaseForecastCents: baseExpectedCents,
    potentialUpliftCents: uplift,
    upliftLowPct: bandLow,
    upliftHighPct: bandHigh,
    narrative,
    confidenceLabel: conf,
  };
}
