/**
 * V8 NON-DESTRUCTIVE ADS LAYER
 *
 * - Read-only use of in-memory metrics passed in or fetched via bridge (no historical row mutation).
 * - Shadow bid/budget numbers are hypothetical caps for operator review — never applied by this codebase.
 * - Does not alter attribution, spend truth, or campaign execution logic elsewhere.
 */
import type { AdsPerformanceSummary, CampaignAdsMetrics } from "./ads-performance.service";
import {
  DEFAULT_ADS_SCALING_THRESHOLDS,
  detectWinningCampaigns,
  type AdsScalingThresholds,
} from "./ads-performance.service";
import type {
  V8AlertCandidate,
  V8AnomalySignal,
  V8CampaignDiagnostic,
  V8DiagnosticBucket,
  V8QualityScoreResult,
  V8ShadowBidBudgetRecommendation,
} from "./ads-v8-non-destructive.types";

const SHADOW_MAX_ABS_PCT = 15;

function minVolume(m: CampaignAdsMetrics): number {
  return m.impressions + m.clicks + m.leads + m.bookingsCompleted;
}

function bucketForCampaign(
  c: CampaignAdsMetrics,
  thresholds: AdsScalingThresholds,
): { bucket: V8DiagnosticBucket; notes: string[] } {
  const vol = minVolume(c);
  const notes: string[] = [];
  if (vol === 0) {
    return { bucket: "insufficient_volume", notes: ["No events in window — diagnostic only."] };
  }
  const { winners, losers, neutral } = detectWinningCampaigns([c], thresholds);
  if (winners.some((w) => w.campaignKey === c.campaignKey)) {
    notes.push("Threshold heuristics classify this row toward winner-style signals (advisory).");
    return { bucket: "winner_signal", notes };
  }
  if (losers.some((l) => l.campaignKey === c.campaignKey)) {
    notes.push("Threshold heuristics classify this row toward loser-style signals (advisory).");
    return { bucket: "loser_signal", notes };
  }
  notes.push("Neutral relative to default scaling thresholds — not a verdict on creative quality.");
  return { bucket: "neutral", notes };
}

/** Per-campaign diagnostic view — does not persist or mutate stores. */
export function buildV8CampaignDiagnostic(
  c: CampaignAdsMetrics,
  thresholds: AdsScalingThresholds = DEFAULT_ADS_SCALING_THRESHOLDS,
): V8CampaignDiagnostic {
  const { bucket, notes } = bucketForCampaign(c, thresholds);
  return {
    campaignKey: c.campaignKey,
    bucket,
    notes,
    raw: {
      impressions: c.impressions,
      clicks: c.clicks,
      leads: c.leads,
      bookingsCompleted: c.bookingsCompleted,
      ctrPercent: c.ctrPercent,
      cpl: c.cpl,
      conversionRatePercent: c.conversionRatePercent,
    },
  };
}

export function buildV8CampaignDiagnostics(campaigns: CampaignAdsMetrics[]): V8CampaignDiagnostic[] {
  return campaigns.map((c) => buildV8CampaignDiagnostic(c));
}

/**
 * Single-window anomaly heuristics on aggregates (growth_events–derived metrics only).
 * Does not rewrite source events or attribution.
 */
export function detectV8AdsAnomalies(campaigns: CampaignAdsMetrics[]): V8AnomalySignal[] {
  const out: V8AnomalySignal[] = [];
  for (const c of campaigns) {
    const vol = minVolume(c);
    if (vol > 0 && vol < 30) {
      out.push({
        campaignKey: c.campaignKey,
        kind: "low_sample",
        severity: "info",
        message: "Low event volume in window — treat ratios as indicative only.",
      });
    }
    const ctr = c.ctrPercent ?? 0;
    if (c.impressions >= 400 && ctr < 0.35) {
      out.push({
        campaignKey: c.campaignKey,
        kind: "ctr_floor",
        severity: "watch",
        message: "CTR is very low versus typical exploration floors — review creative/landing alignment (advisory).",
      });
    }
    if (c.cpl != null && c.estimatedSpend > 0 && c.cpl >= DEFAULT_ADS_SCALING_THRESHOLDS.loserCplMin * 1.4) {
      out.push({
        campaignKey: c.campaignKey,
        kind: "cpl_extreme",
        severity: "review",
        message: "CPL is elevated vs default loser threshold — validate spend inputs and in-network reality before acting.",
      });
    }
    const conv = c.conversionRatePercent ?? 0;
    if (c.clicks >= 80 && conv > 85) {
      out.push({
        campaignKey: c.campaignKey,
        kind: "conversion_outlier",
        severity: "info",
        message: "Conversion rate is unusually high — confirm event mapping and sample size.",
      });
    }
    if (c.impressions >= 200 && c.clicks > c.impressions) {
      out.push({
        campaignKey: c.campaignKey,
        kind: "volume_spike_suspect",
        severity: "review",
        message: "Click count exceeds impression proxy for this campaign key — check UTM consistency (data quality).",
      });
    }
  }
  return dedupeAnomalies(out);
}

function dedupeAnomalies(signals: V8AnomalySignal[]): V8AnomalySignal[] {
  const seen = new Set<string>();
  const out: V8AnomalySignal[] = [];
  for (const s of signals) {
    const k = `${s.campaignKey}|${s.kind}|${s.message}`;
    if (seen.has(k)) continue;
    seen.add(k);
    out.push(s);
  }
  return out;
}

function clampPct(n: number, maxAbs: number): number {
  if (!Number.isFinite(n)) return 0;
  return Math.max(-maxAbs, Math.min(maxAbs, n));
}

/**
 * Shadow budget/bid hints — bounded percentages for manual review only.
 */
export function buildV8ShadowBidBudgetRecommendation(c: CampaignAdsMetrics): V8ShadowBidBudgetRecommendation {
  const rationale: string[] = [];
  let suggestedDailyBudgetDeltaPct: number | null = null;

  const { winners, losers } = detectWinningCampaigns([c], DEFAULT_ADS_SCALING_THRESHOLDS);
  const isWinner = winners.some((w) => w.campaignKey === c.campaignKey);
  const isLoser = losers.some((l) => l.campaignKey === c.campaignKey);

  if (isWinner && minVolume(c) >= 40) {
    suggestedDailyBudgetDeltaPct = clampPct(8, SHADOW_MAX_ABS_PCT);
    rationale.push("Winner-style signals with usable volume — shadow explore-up within cap (manual).");
  } else if (isLoser && minVolume(c) >= 40) {
    suggestedDailyBudgetDeltaPct = clampPct(-10, SHADOW_MAX_ABS_PCT);
    rationale.push("Loser-style signals — shadow trim suggestion only; confirm in Ads Manager.");
  } else {
    rationale.push("No strong directional shadow budget delta — hold or gather more volume first.");
  }

  const delta =
    suggestedDailyBudgetDeltaPct != null
      ? Math.max(-SHADOW_MAX_ABS_PCT, Math.min(SHADOW_MAX_ABS_PCT, suggestedDailyBudgetDeltaPct))
      : null;

  return {
    campaignKey: c.campaignKey,
    suggestedDailyBudgetDeltaPct: delta,
    suggestedBidDeltaPct: null,
    rationale,
    safety: {
      manualOnly: true,
      neverAutoApply: true,
      maxAbsPctDelta: SHADOW_MAX_ABS_PCT,
      executionSurface: "ads_manager_manual",
    },
  };
}

/** Heuristic quality score — does not replace evidence scores elsewhere. */
export function scoreV8AdsQuality(c: CampaignAdsMetrics): V8QualityScoreResult {
  const ctrP = typeof c.ctrPercent === "number" && Number.isFinite(c.ctrPercent) ? c.ctrPercent : 0;
  const convP =
    typeof c.conversionRatePercent === "number" && Number.isFinite(c.conversionRatePercent)
      ? c.conversionRatePercent
      : 0;
  const ctr = Math.min(100, (ctrP / 4) * 100);
  const conv = Math.min(100, (convP / 25) * 100);
  const vol = Math.min(100, (Math.log10(1 + minVolume(c)) / Math.log10(1 + 5000)) * 100);
  const ctrC = Math.round(ctr * 100) / 100;
  const convC = Math.round(conv * 100) / 100;
  const volC = Math.round(vol * 100) / 100;
  const raw = ctr * 0.4 + conv * 0.35 + vol * 0.25;
  const score = Number.isFinite(raw) ? Math.min(100, Math.max(0, Math.round(raw * 100) / 100)) : 0;
  return {
    score,
    factors: {
      ctrComponent: Number.isFinite(ctrC) ? ctrC : 0,
      conversionComponent: Number.isFinite(convC) ? convC : 0,
      volumeComponent: Number.isFinite(volC) ? volC : 0,
    },
  };
}

/** Informational alerts — safe to surface in UI; never blocks execution paths here. */
export function buildV8AdsNonDestructiveAlerts(
  summary: AdsPerformanceSummary | null,
  campaigns: CampaignAdsMetrics[],
): V8AlertCandidate[] {
  const alerts: V8AlertCandidate[] = [];
  if (summary && summary.leads > 0 && summary.estimatedSpend <= 0) {
    alerts.push({
      level: "info",
      scope: "portfolio",
      code: "spend_unknown_cpl",
      message: "CPL is not modeled without estimated spend — shadow recommendations stay non-binding.",
    });
  }
  const totalVol = campaigns.reduce((a, c) => a + minVolume(c), 0);
  if (totalVol > 0 && totalVol < 120) {
    alerts.push({
      level: "watch",
      scope: "portfolio",
      code: "thin_portfolio_volume",
      message: "Portfolio event volume is thin — widen window or confirm tracking before budget moves.",
    });
  }
  return dedupeAlerts(alerts);
}

function dedupeAlerts(alerts: V8AlertCandidate[]): V8AlertCandidate[] {
  const seen = new Set<string>();
  const out: V8AlertCandidate[] = [];
  for (const a of alerts) {
    const k = `${a.code}|${a.scope}|${a.campaignKey ?? ""}|${a.message}`;
    if (seen.has(k)) continue;
    seen.add(k);
    out.push(a);
  }
  return out;
}
