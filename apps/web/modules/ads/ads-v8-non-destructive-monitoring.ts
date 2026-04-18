/**
 * Lightweight run stats + observational warnings for V8 non-destructive analysis (passive).
 */
import type {
  V8AlertCandidate,
  V8AnomalyKind,
  V8AnomalySignal,
  V8CampaignDiagnostic,
  V8NonDestructiveRunStats,
  V8QualityScoreResult,
  V8ShadowBidBudgetRecommendation,
} from "./ads-v8-non-destructive.types";

const SEVERITY_ORDER: Record<V8AnomalySignal["severity"], number> = {
  review: 3,
  watch: 2,
  info: 1,
};

export function buildV8NonDestructiveRunStats(input: {
  campaignsAnalyzed: number;
  diagnostics: V8CampaignDiagnostic[];
  anomalies: V8AnomalySignal[];
  qualityByCampaign: Array<{ campaignKey: string } & V8QualityScoreResult>;
  shadowBidBudget: V8ShadowBidBudgetRecommendation[];
  alerts: V8AlertCandidate[];
}): V8NonDestructiveRunStats {
  const n = Math.max(0, input.campaignsAnalyzed);
  const insufficient = input.diagnostics.filter((d) => d.bucket === "insufficient_volume").length;
  const insufficientDataCampaignPct = n > 0 ? (insufficient / n) * 100 : 0;

  const anomalyKindCounts = {} as Record<V8AnomalyKind, number>;
  for (const a of input.anomalies) {
    anomalyKindCounts[a.kind] = (anomalyKindCounts[a.kind] ?? 0) + 1;
  }

  const scores = input.qualityByCampaign.map((q) => q.score).filter((s) => Number.isFinite(s));
  const avgQualityScore =
    scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;
  const mean = avgQualityScore;
  const variance =
    scores.length > 1
      ? scores.reduce((acc, s) => acc + (s - mean) ** 2, 0) / (scores.length - 1)
      : 0;

  const withRec = input.shadowBidBudget.filter((s) => s.suggestedDailyBudgetDeltaPct != null);
  const shadowRecommendationCount = withRec.length;
  const shadowRecommendationRatePct = n > 0 ? (shadowRecommendationCount / n) * 100 : 0;
  let shadowUpCount = 0;
  let shadowDownCount = 0;
  let shadowHoldCount = 0;
  for (const s of input.shadowBidBudget) {
    const p = s.suggestedDailyBudgetDeltaPct;
    if (p == null) shadowHoldCount++;
    else if (p > 0) shadowUpCount++;
    else if (p < 0) shadowDownCount++;
    else shadowHoldCount++;
  }

  const anomalyRatePerCampaign = n > 0 ? input.anomalies.length / n : 0;

  const observationalWarnings = collectObservationalWarnings({
    n,
    insufficientDataCampaignPct,
    anomalyCount: input.anomalies.length,
    anomalyRatePerCampaign,
    scores,
    variance,
    shadowRecommendationRatePct,
    shadowUpCount,
    shadowDownCount,
    alertCount: input.alerts.length,
    diagnosticsLen: input.diagnostics.length,
  });

  return {
    campaignsAnalyzed: n,
    insufficientDataCampaignPct,
    anomalyCount: input.anomalies.length,
    anomalyRatePerCampaign,
    anomalyKindCounts,
    avgQualityScore: Math.round(avgQualityScore * 100) / 100,
    qualityScoreVariance: Math.round(variance * 1000) / 1000,
    shadowRecommendationCount,
    shadowRecommendationRatePct: Math.round(shadowRecommendationRatePct * 100) / 100,
    shadowUpCount,
    shadowDownCount,
    shadowHoldCount,
    alertCount: input.alerts.length,
    observationalWarnings,
  };
}

function collectObservationalWarnings(p: {
  n: number;
  insufficientDataCampaignPct: number;
  anomalyCount: number;
  anomalyRatePerCampaign: number;
  scores: number[];
  variance: number;
  shadowRecommendationRatePct: number;
  shadowUpCount: number;
  shadowDownCount: number;
  alertCount: number;
  diagnosticsLen: number;
}): string[] {
  const w: string[] = [];
  if (p.n === 0) w.push("empty_campaign_input");
  if (p.insufficientDataCampaignPct >= 85 && p.n >= 3) w.push("high_insufficient_data_rate");
  if (p.diagnosticsLen === 0 && p.n > 0) w.push("unexpected_empty_diagnostics");
  if (p.anomalyRatePerCampaign > 3 && p.n >= 2) w.push("abnormal_anomaly_rate");
  if (p.anomalyCount === 0 && p.n >= 8) w.push("suspicious_anomaly_silence");
  if (p.scores.length >= 4 && p.variance < 2) w.push("quality_scores_too_similar");
  if (p.shadowRecommendationRatePct >= 92 && p.n >= 5) w.push("recommendation_saturation");
  if (p.shadowUpCount > 0 && p.shadowDownCount === 0 && p.n >= 6) w.push("shadow_recommendations_clustered_up");
  if (p.shadowDownCount > 0 && p.shadowUpCount === 0 && p.n >= 6) w.push("shadow_recommendations_clustered_down");
  if (p.alertCount > 18) w.push("alert_explosion");
  if (p.alertCount === 0 && p.n >= 10) w.push("alert_silence");
  return w;
}

/** Cap total anomalies to reduce noise; keeps higher-severity rows first. */
export function capAnomalySignals(signals: V8AnomalySignal[], maxTotal = 72): V8AnomalySignal[] {
  const sorted = [...signals].sort(
    (a, b) => SEVERITY_ORDER[b.severity] - SEVERITY_ORDER[a.severity] || a.campaignKey.localeCompare(b.campaignKey),
  );
  return sorted.slice(0, maxTotal);
}
