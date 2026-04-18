/**
 * Orchestrates V8 non-destructive analysis using existing read-only ads performance getters.
 * Does not mutate historical records, spend, or campaign definitions.
 */
import { logInfo, logWarn } from "@/lib/logger";
import {
  getAdsPerformanceByCampaign,
  getAdsPerformanceSummary,
} from "./ads-performance.service";
import {
  buildV8CampaignDiagnostics,
  buildV8ShadowBidBudgetRecommendation,
  buildV8AdsNonDestructiveAlerts,
  detectV8AdsAnomalies,
  scoreV8AdsQuality,
} from "./ads-v8-non-destructive.service";
import {
  sanitizeAdsPerformanceSummaryForV8,
  sanitizeCampaignAdsMetricsList,
} from "./ads-v8-non-destructive-inputs";
import { buildV8NonDestructiveRunStats, capAnomalySignals } from "./ads-v8-non-destructive-monitoring";
import type { V8NonDestructiveBundle } from "./ads-v8-non-destructive.types";

const NS = "[ads:v8:non_destructive]";

const DISCLAIMERS = [
  "V8 non-destructive mode: advisory only. Attribution follows growth_events ingestion — this bundle does not change it.",
  "Shadow bid/budget deltas are capped suggestions for manual application in Ads Manager.",
] as const;

export async function runAdsV8NonDestructiveAnalysis(opts: {
  rangeDays: number;
  offsetDays?: number;
  estimatedSpend?: number;
  estimatedSpendByCampaign?: Record<string, number>;
}): Promise<V8NonDestructiveBundle> {
  const rangeDays = opts.rangeDays;
  const offsetDays = opts.offsetDays ?? 0;
  const [summaryRaw, campaignsRaw] = await Promise.all([
    getAdsPerformanceSummary(rangeDays, { estimatedSpend: opts.estimatedSpend, offsetDays }),
    getAdsPerformanceByCampaign(rangeDays, {
      offsetDays,
      estimatedSpendByCampaign: opts.estimatedSpendByCampaign,
    }),
  ]);

  const summary = sanitizeAdsPerformanceSummaryForV8(summaryRaw);
  const campaigns = sanitizeCampaignAdsMetricsList(campaignsRaw);

  const inputWarnings: string[] = [];
  if (campaignsRaw.some((c) => !c.campaignKey || typeof c.campaignKey !== "string" || !String(c.campaignKey).trim())) {
    inputWarnings.push("missing_or_blank_campaign_key_in_source");
  }
  if (summary.leads > 0 && summary.estimatedSpend <= 0) {
    inputWarnings.push("leads_without_estimated_spend_cpl_unmodeled");
  }

  const diagnostics = buildV8CampaignDiagnostics(campaigns);
  const anomalies = capAnomalySignals(detectV8AdsAnomalies(campaigns));
  const shadowBidBudget = campaigns.map((c) => buildV8ShadowBidBudgetRecommendation(c));
  const qualityByCampaign = campaigns.map((c) => ({
    campaignKey: c.campaignKey,
    ...scoreV8AdsQuality(c),
  }));
  const alerts = buildV8AdsNonDestructiveAlerts(summary, campaigns);

  const monitoring = buildV8NonDestructiveRunStats({
    campaignsAnalyzed: campaigns.length,
    diagnostics,
    anomalies,
    qualityByCampaign,
    shadowBidBudget,
    alerts,
  });
  if (inputWarnings.length) {
    monitoring.observationalWarnings = [...new Set([...monitoring.observationalWarnings, ...inputWarnings])];
  }

  logInfo(NS, {
    campaigns: monitoring.campaignsAnalyzed,
    anomalies: monitoring.anomalyCount,
    avgScore: monitoring.avgQualityScore,
    recommendations: monitoring.shadowRecommendationCount,
    alerts: monitoring.alertCount,
  });
  if (monitoring.observationalWarnings.length > 0) {
    logWarn(NS, "observational_warnings", { warnings: monitoring.observationalWarnings.slice(0, 8) });
  }

  return {
    mode: "v8_non_destructive",
    windowDays: rangeDays,
    diagnostics,
    anomalies,
    shadowBidBudget,
    qualityByCampaign,
    alerts,
    disclaimers: [...DISCLAIMERS],
    monitoring,
  };
}
