import type { CampaignAdsMetrics } from "./ads-performance.service";
import type { CampaignProfitMetrics, ProfitTrendLabel } from "@/modules/growth/profit-engine.types";
import { profitEngineFlags } from "@/config/feature-flags";

export type ScalingRecommendation = {
  action: "increase_budget" | "duplicate_ad_set" | "pause" | "hold";
  campaignKey?: string;
  reason: string;
  confidence: "low" | "medium" | "high";
  detail?: string;
  /** When profit trends enabled — affects copy only; still manual. */
  trendHint?: string;
};

function profitRank(
  rec: ScalingRecommendation,
  profit?: CampaignProfitMetrics,
  trend?: ProfitTrendLabel,
): number {
  const st = profit?.profitabilityStatus;
  const trendsOn = profitEngineFlags.profitEngineTrendsV1 && trend && trend !== "insufficient_data";

  if (rec.action === "increase_budget") {
    let base = 55;
    if (st === "PROFITABLE") base = 100;
    else if (st === "BREAKEVEN") base = 72;
    else if (st === "UNPROFITABLE") base = 38;
    else if (st === "INSUFFICIENT_DATA") base = 50;

    if (trendsOn) {
      if (st === "PROFITABLE" && trend === "improving") base += 12;
      if (st === "PROFITABLE" && trend === "declining") base -= 18;
      if (st === "PROFITABLE" && trend === "unstable") base -= 22;
      if (st === "UNPROFITABLE" && trend === "declining") base -= 8;
    }
    return base;
  }
  if (rec.action === "duplicate_ad_set") {
    let base = 62;
    if (st === "PROFITABLE") base = 96;
    if (trendsOn && st === "PROFITABLE" && trend === "improving") base += 6;
    if (trendsOn && trend === "unstable") base -= 15;
    return base;
  }
  if (rec.action === "pause") {
    let base = 48;
    if (st === "UNPROFITABLE") base = 92;
    if (st === "PROFITABLE") base = 28;
    if (trendsOn && st === "UNPROFITABLE" && (trend === "declining" || trend === "unstable")) base += 10;
    return base;
  }
  return 44;
}

function profitFootnote(p?: CampaignProfitMetrics): string | undefined {
  if (!p) return undefined;
  if (p.profitabilityStatus === "INSUFFICIENT_DATA") {
    return "Profit engine: insufficient leads or missing CPL/LTV — no profit-based priority change.";
  }
  if (p.profitabilityStatus === "PROFITABLE") {
    return `Profit engine: favorable LTV vs CPL estimate (ratio ${p.ltvToCplRatio?.toFixed(2) ?? "—"}×) — boosts suggestion priority (manual only).`;
  }
  if (p.profitabilityStatus === "UNPROFITABLE") {
    return "Profit engine: estimated LTV below CPL — downgrades scale suggestions; review before spend.";
  }
  if (p.profitabilityStatus === "BREAKEVEN") {
    return "Profit engine: near breakeven on estimates — proceed cautiously.";
  }
  return undefined;
}

function trendSentence(trend: ProfitTrendLabel | undefined, p?: CampaignProfitMetrics): string | undefined {
  if (!profitEngineFlags.profitEngineTrendsV1 || !trend || trend === "insufficient_data") return undefined;
  if (trend === "improving") return "Profit trend: improving vs prior window — slightly stronger scale case (still manual).";
  if (trend === "declining") {
    return p?.profitabilityStatus === "PROFITABLE"
      ? "Profit trend: declining — scale cautiously."
      : "Profit trend: declining — review efficiency before more spend.";
  }
  if (trend === "unstable") return "Profit trend: unstable — prefer monitor until ratios stabilize.";
  return undefined;
}

function confidenceForRec(
  rec: ScalingRecommendation,
  profit?: CampaignProfitMetrics,
  trend?: ProfitTrendLabel,
): "low" | "medium" | "high" {
  const ev = profit?.evidenceQuality;
  const conf = profit?.confidenceScore ?? profit?.confidence ?? 0;
  if (rec.action === "increase_budget") {
    if (ev === "LOW" || conf < 0.45) return "low";
    if (trend === "unstable") return "low";
    if (profit?.profitabilityStatus === "PROFITABLE" && trend === "improving" && ev === "HIGH") return "high";
    if (profit?.profitabilityStatus === "PROFITABLE" && trend === "declining") return "medium";
    if (profit?.profitabilityStatus === "PROFITABLE") return "high";
    return "medium";
  }
  if (rec.action === "duplicate_ad_set") {
    if (trend === "unstable" || ev === "LOW") return "low";
    return "medium";
  }
  if (rec.action === "pause") {
    if (profit?.profitabilityStatus === "UNPROFITABLE" && (trend === "declining" || trend === "unstable"))
      return "high";
    return "medium";
  }
  return "low";
}

/**
 * Human-readable scaling plays — planning only; no API spend.
 * When `profitByCampaign` is set, ordering reflects profit (not auto-scale).
 */
export function generateScalingRecommendations(
  winners: CampaignAdsMetrics[],
  losers: CampaignAdsMetrics[],
  options?: {
    stableWinnerKeys?: string[];
    profitByCampaign?: Record<string, CampaignProfitMetrics>;
    profitTrendByCampaign?: Record<string, ProfitTrendLabel>;
  },
): ScalingRecommendation[] {
  const out: ScalingRecommendation[] = [];
  const stable = new Set(options?.stableWinnerKeys ?? []);
  const profitBy = options?.profitByCampaign ?? {};
  const trendBy = options?.profitTrendByCampaign ?? {};

  for (const w of winners) {
    const p = profitBy[w.campaignKey];
    const tr = trendBy[w.campaignKey];
    const isStable =
      stable.has(w.campaignKey) ||
      (w.ctrPercent ?? 0) >= 2.5 ||
      ((w.conversionRatePercent ?? 0) >= 5 && (w.ctrPercent ?? 0) >= 1.5);

    const baseDetail =
      "Suggest +20% daily budget cap in Ads Manager for 3–5 days, then re-check KPIs. Never auto-increase spend from LECIPM.";
    const foot = profitFootnote(p);
    const tline = trendSentence(tr, p);
    out.push({
      action: "increase_budget",
      campaignKey: w.campaignKey,
      reason: "Campaign meets CTR / CPL / conversion thresholds.",
      confidence: confidenceForRec({ action: "increase_budget" }, p, tr),
      detail: [foot, tline, baseDetail].filter(Boolean).join(" "),
      trendHint: tline,
    });

    if (isStable) {
      out.push({
        action: "duplicate_ad_set",
        campaignKey: w.campaignKey,
        reason: "Stable winner — diversify creative while holding structure.",
        confidence: confidenceForRec({ action: "duplicate_ad_set" }, p, tr),
        detail: [foot, tline, "Duplicate the winning ad set with one new headline/hero variant; keep same audience."]
          .filter(Boolean)
          .join(" "),
        trendHint: tline,
      });
    }
  }

  for (const l of losers) {
    const p = profitBy[l.campaignKey];
    const tr = trendBy[l.campaignKey];
    const foot = profitFootnote(p);
    const tline = trendSentence(tr, p);
    out.push({
      action: "pause",
      campaignKey: l.campaignKey,
      reason: "CTR below floor or CPL above ceiling.",
      confidence: confidenceForRec({ action: "pause" }, p, tr),
      detail: [foot, tline, "Pause or reduce budget until creative/landing is refreshed."].filter(Boolean).join(" "),
      trendHint: tline,
    });
  }

  if (winners.length === 0 && losers.length === 0) {
    out.push({
      action: "hold",
      reason: "No clear winner/loser in this window — gather more volume before scaling.",
      confidence: "low",
    });
  }

  return out
    .map((rec) => ({
      rec,
      rank: profitRank(rec, rec.campaignKey ? profitBy[rec.campaignKey] : undefined, trendBy[rec.campaignKey ?? ""]),
    }))
    .sort((a, b) => b.rank - a.rank)
    .map(({ rec }) => rec);
}
