import { listRuns } from "@/modules/growth-automation/automation-flow.service";
import { buildLeadDashboardStats, listLeads } from "@/modules/growth-leads/leads-capture.service";
import { listContentItems } from "@/modules/marketing-content/content-calendar.service";
import { buildMarketingContentDashboardSummaryFromItems } from "@/modules/marketing-content/content-performance.service";
import { loadMarketingAiStore } from "@/modules/marketing-ai/marketing-ai-storage";
import { listSeoContentPieces } from "@/modules/seo-growth/seo-content.service";
import {
  buildSeoPerformanceSummary,
  loadSeoMetricsStore,
} from "@/modules/seo-growth/seo-ranking.service";

import type {
  GrowthDomain,
  NormalizedSignal,
  SignalSeverity,
  SignalType,
} from "./growth-brain.types";

export function uid(): string {
  return typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `sig-${Date.now()}`;
}

function mk(
  signalType: SignalType,
  domain: GrowthDomain,
  severity: SignalSeverity,
  confidence: number,
  expectedImpact: number,
  title: string,
  summary: string,
  sourceData: Record<string, string | number | boolean | null>,
  region?: string
): NormalizedSignal {
  return {
    signalId: uid(),
    signalType,
    domain,
    severity,
    confidence: Math.max(0, Math.min(1, confidence)),
    expectedImpact: Math.max(0, Math.min(1, expectedImpact)),
    region,
    sourceData,
    title,
    summary,
    observedAtIso: new Date().toISOString(),
  };
}

/**
 * Aggregates growth signals from in-app modules (browser local stores) and normalizes them.
 * Server-side calls use empty stores; still returns structural insight with lower confidence.
 */
export function aggregateGrowthSignals(): NormalizedSignal[] {
  const out: NormalizedSignal[] = [];

  const leads = listLeads();
  const leadStats = buildLeadDashboardStats(leads);
  const converted = leads.filter((l) => l.lifecycle === "CONVERTED").length;
  const brokerish = leads.filter((l) => l.intent === "BROKER").length;

  const content = listContentItems();
  const mktSummary = buildMarketingContentDashboardSummaryFromItems(content);

  let totalViews = 0;
  let totalLeadsFromContent = 0;
  for (const c of content) {
    totalViews += c.performance.views;
    totalLeadsFromContent += c.performance.leads;
  }
  const weakConv =
    totalViews > 400 &&
    totalLeadsFromContent < Math.max(3, Math.floor(totalViews / 2500));

  if (weakConv && content.filter((c) => c.status === "POSTED").length >= 3) {
    out.push(
      mk(
        "STRONG_TRAFFIC_WEAK_CONVERSION",
        "MARKETING",
        "important",
        0.72,
        0.68,
        "Strong content reach, weak downstream conversion",
        "Marketing surfaces drive views but attributed leads per thousand views are below threshold.",
        {
          totalViews,
          leadsFromContent: totalLeadsFromContent,
          posts: content.length,
          postsThisWeek: mktSummary.postsThisWeek,
        }
      )
    );
  }

  if (mktSummary.postsThisWeek >= 5 && leadStats.winRateVsAll < 0.05 && leads.length >= 5) {
    out.push(
      mk(
        "STRONG_CONTENT_WEAK_LEAD_CAPTURE",
        "MARKETING",
        "watch",
        0.62,
        0.52,
        "Publishing cadence without win lift",
        "Weekly content activity is elevated but attributed win rate from leads remains low.",
        {
          postsThisWeek: mktSummary.postsThisWeek,
          winRateVsAll: leadStats.winRateVsAll,
        }
      )
    );
  }

  const leadConvRate =
    leads.length > 0 ? converted / leads.length : 0;
  if (leads.length >= 8 && leadConvRate < 0.08) {
    out.push(
      mk(
        "PIPELINE_STAGE_LEAK",
        "SALES",
        "important",
        0.65,
        0.7,
        "Pipeline conversion under target",
        "Lead volume exists but CONVERTED share is low — inspect stage handoffs and brokerage follow-up.",
        {
          leads: leads.length,
          converted,
          leadConvRate,
        }
      )
    );
  }

  if (brokerish >= 5) {
    out.push(
      mk(
        "BROKER_LEAD_RISING",
        "BROKER",
        "watch",
        0.6,
        0.55,
        "Broker intent volume elevated",
        "Inbound broker/partner signals increased — verify routing capacity and onboarding SLAs.",
        { brokerLeads: brokerish }
      )
    );
  }

  const seoPieces = listSeoContentPieces();
  const seoMetrics = loadSeoMetricsStore().metrics;
  const seoPerf = buildSeoPerformanceSummary(seoPieces, seoMetrics);
  if (
    seoPieces.length >= 3 &&
    seoPerf.totalSessions > 40 &&
    seoPerf.totalLeadsFromSeo < 3
  ) {
    out.push(
      mk(
        "SEO_TRACTION_LEAD_GAP",
        "MARKETING",
        "watch",
        0.62,
        0.58,
        "SEO sessions without proportional leads",
        "Organic sessions are building but capture CTAs or routing may need tightening.",
        {
          seoSessions: seoPerf.totalSessions,
          seoLeads: seoPerf.totalLeadsFromSeo,
          pieces: seoPieces.length,
        }
      )
    );
  }

  try {
    const mq = loadMarketingAiStore().queue.filter((q) => q.status === "PENDING_APPROVAL").length;
    if (mq >= 5) {
      out.push(
        mk(
          "MARKETING_EFFICIENCY_GAP",
          "MARKETING",
          "watch",
          0.58,
          0.45,
          "Marketing queue backlog",
          `${mq} autonomous marketing items await approval — throughput risk for weekly cadence.`,
          { pendingApprovals: mq }
        )
      );
    }
  } catch {
    /* noop */
  }

  const automationRuns = listRuns().length;
  if (automationRuns > 0 && totalViews > 150 && totalLeadsFromContent < 4) {
    out.push(
      mk(
        "AUTOMATION_ENGAGEMENT_LOW",
        "MARKETING",
        "info",
        0.55,
        0.42,
        "Automation active but marketing funnel soft",
        "Growth automation runs while top-of-funnel conversion remains soft — align CTAs with routing.",
        { automationRuns, totalViews }
      )
    );
  }

  // Synthetic cross-cutting signals when module data is sparse (bounded, explainable defaults)
  if (out.length < 2) {
    out.push(
      mk(
        "FORECAST_OPPORTUNITY_HIGH",
        "INVESTOR",
        "info",
        0.45,
        0.5,
        "Forecast upside cluster (monitoring)",
        "Limited live signals — monitor investor BNHub corridor and tighten weekly forecast review.",
        { synthetic: true }
      )
    );
    out.push(
      mk(
        "BNHUB_DEMAND_SPIKE",
        "BNHUB",
        "watch",
        0.48,
        0.52,
        "BNHub demand variability",
        "Watch weekend compression in Old Montréal supply vs search intent — prioritize supply outreach if sustained.",
        { synthetic: true, region: "Montreal" }
      )
    );
  }

  return out.sort((a, b) => {
    const rank = { critical: 4, important: 3, watch: 2, info: 1 };
    return (
      (rank[b.severity] - rank[a.severity]) ||
      b.expectedImpact - a.expectedImpact
    );
  });
}
