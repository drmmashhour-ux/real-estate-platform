/**
 * Aggregates real CRM + growth-layer signals — omits metrics when unsupported; never fabricates values.
 */

import { engineFlags } from "@/config/feature-flags";
import { prisma } from "@/lib/db";
import {
  DEFAULT_FAST_DEAL_COMPARISON_CITIES,
  buildCityComparison,
} from "@/modules/growth/fast-deal-city-comparison.service";
import { buildGrowthExecutionResultsSummary } from "@/modules/growth/growth-execution-results.service";
import { buildScaleSystemResults } from "@/modules/growth/scale-system-results.service";
import { buildRevenueForecast } from "@/modules/growth/revenue-forecast.service";
import type { InvestorMetric, MetricConfidence } from "@/modules/investors/investor-dashboard.types";
import {
  logInvestorDashboardMissing,
} from "@/modules/investors/investor-dashboard-monitoring.service";

export type InvestorNarrativeInput = {
  windowDays: number;
  leadsCur: number;
  leadsPrev: number;
  dealsWonCur: number;
  dealsWonPrev: number;
  qualifiedPct: number | null;
  revenueInsufficient: boolean;
  revenueCentralCad: number | null;
  revenueBandLabel: string | null;
  forecastConfidence: MetricConfidence | null;
  aiSparseTelemetry: boolean;
  brokerInsufficientUniform: boolean;
  scaleLeadDelta: number | null;
  scaleLeadBand: string | null;
  topCity: string | null;
  topCityScore: number | null;
  weakestCity: string | null;
  expansionSnippet: string | null;
  comparisonInsightLines: string[];
  sparseBundle: boolean;
};

function conf(count: number): MetricConfidence {
  if (count >= 48) return "high";
  if (count >= 18) return "medium";
  return "low";
}

async function pipelineCounts(start: Date, end: Date) {
  const rows = await prisma.lead.findMany({
    where: { createdAt: { gte: start, lt: end } },
    select: { pipelineStage: true },
  });
  const leads = rows.length;
  const qualified = rows.filter((r) =>
    ["qualified", "meeting", "negotiation", "won"].includes(r.pipelineStage),
  ).length;
  const pct = leads > 0 ? qualified / leads : null;
  return { leads, qualified, qualifiedPct: pct };
}

async function dealsWonCount(start: Date, end: Date) {
  return prisma.lead.count({
    where: {
      pipelineStage: "won",
      updatedAt: { gte: start, lt: end },
    },
  });
}

export async function gatherInvestorDashboardSignals(
  windowDays: number,
): Promise<{ metrics: InvestorMetric[]; warnings: string[]; missingDataAreas: string[]; narrativeInput: InvestorNarrativeInput }> {
  const warnings: string[] = [];
  const missingDataAreas: string[] = [];
  const metrics: InvestorMetric[] = [];

  const until = new Date();
  const curStart = new Date(until.getTime() - windowDays * 86400000);
  const prevStart = new Date(until.getTime() - 2 * windowDays * 86400000);
  const periodLabel = `last ${windowDays}d`;

  const [curPipe, prevPipe, wonCur, wonPrev, gExec, scale, rf, cmp] = await Promise.all([
    pipelineCounts(curStart, until),
    pipelineCounts(prevStart, curStart),
    dealsWonCount(curStart, until),
    dealsWonCount(prevStart, curStart),
    engineFlags.growthExecutionResultsV1 ? buildGrowthExecutionResultsSummary(windowDays).catch(() => null) : Promise.resolve(null),
    buildScaleSystemResults(windowDays),
    buildRevenueForecast(windowDays),
    engineFlags.fastDealCityComparisonV1 && DEFAULT_FAST_DEAL_COMPARISON_CITIES.length
      ? buildCityComparison([...DEFAULT_FAST_DEAL_COMPARISON_CITIES], windowDays).catch(() => null)
      : Promise.resolve(null),
  ]);

  const aiSparseTelemetry = !!(gExec?.sparseDataWarnings ?? []).some((w) =>
    /telemetry|sparse|AI execution/i.test(w),
  );

  const brokerInsufficientUniform =
    !!gExec &&
    gExec.brokerCompetitionResults.length > 0 &&
    gExec.brokerCompetitionResults.every((b) => b.outcomeBand === "insufficient_data");

  const leadsDelta = curPipe.leads - prevPipe.leads;
  const wonDelta = wonCur - wonPrev;

  metrics.push({
    label: "New leads captured",
    value: String(curPipe.leads),
    change: `${leadsDelta >= 0 ? "+" : ""}${leadsDelta} vs prior ${windowDays}d`,
    period: periodLabel,
    confidence: conf(curPipe.leads + prevPipe.leads),
  });

  if (curPipe.leads > 0 && curPipe.qualifiedPct != null) {
    metrics.push({
      label: "Qualified-or-better share",
      value: `${(curPipe.qualifiedPct * 100).toFixed(1)}%`,
      period: periodLabel,
      confidence: conf(curPipe.leads),
    });
  } else {
    missingDataAreas.push("Qualified share (no leads or stages in window)");
    logInvestorDashboardMissing("qualified-share");
  }

  metrics.push({
    label: "Closed-won (CRM, window-by-update)",
    value: String(wonCur),
    change: `${wonDelta >= 0 ? "+" : ""}${wonDelta}`,
    period: periodLabel,
    confidence: conf(wonCur + wonPrev),
  });

  const scaleLead = scale.find((s) => s.targetType === "leads");

  metrics.push({
    label: "Scale-system lead delta vs prior window",
    value: scaleLead != null ? `${scaleLead.delta >= 0 ? "+" : ""}${scaleLead.delta}` : "—",
    period: periodLabel,
    confidence:
      scaleLead && Math.abs(scaleLead.delta) >= 15 ? "medium" : scaleLead ? "low" : "low",
  });

  let revenueBandLabel: string | null = null;
  let revenueCentralCad: number | null = null;

  if (rf.meta.insufficientData) {
    missingDataAreas.push("Revenue illustration (CRM sample too thin)");
    warnings.push(...rf.meta.warnings.slice(0, 3));
    logInvestorDashboardMissing("revenue-forecast");
  } else if (rf.revenue.expectedRevenue != null) {
    revenueCentralCad = rf.revenue.expectedRevenue;
    revenueBandLabel = `${rf.revenue.conservativeEstimate ?? "—"}–${rf.revenue.optimisticEstimate ?? "—"} CAD (illustrative)`;
    metrics.push({
      label: "Illustrative revenue band (CRM-based)",
      value: `${rf.revenue.expectedRevenue.toLocaleString()} CAD central`,
      change: revenueBandLabel,
      period: periodLabel,
      confidence: rf.meta.confidence === "high" ? "medium" : rf.meta.confidence,
    });
  }

  let topCity: string | null = null;
  let topCityScore: number | null = null;
  let weakestCity: string | null = null;
  let expansionSnippet: string | null = null;
  const comparisonInsightLines: string[] = [];

  if (cmp?.rankedCities?.length) {
    topCity = cmp.rankedCities[0]?.city ?? null;
    topCityScore = cmp.rankedCities[0]?.performanceScore ?? null;
    weakestCity = cmp.rankedCities[cmp.rankedCities.length - 1]?.city ?? null;
    expansionSnippet = cmp.insights?.[0] ?? null;
    comparisonInsightLines.push(...(cmp.insights ?? []).slice(0, 4));
    metrics.push({
      label: "Leading Fast Deal city (bundle)",
      value: topCity ?? "—",
      change: topCityScore != null ? `score≈${topCityScore}` : undefined,
      period: periodLabel,
      confidence:
        cmp.rankedCities[0]?.confidence === "high"
          ? "medium"
          : cmp.rankedCities[0]?.confidence === "medium"
            ? "medium"
            : "low",
    });
  } else {
    missingDataAreas.push("City comparison bundle");
    logInvestorDashboardMissing("city-comparison");
    warnings.push("City comparison unavailable — geographic story uses CRM only.");
  }

  let forecastConfidence: MetricConfidence | null = rf.meta.insufficientData ? null : rf.meta.confidence;

  const lowMetricCount = metrics.filter((m) => m.confidence === "low").length;
  const sparseBundle = lowMetricCount >= Math.ceil(metrics.length * 0.55) || missingDataAreas.length >= 3;

  const narrativeInput: InvestorNarrativeInput = {
    windowDays,
    leadsCur: curPipe.leads,
    leadsPrev: prevPipe.leads,
    dealsWonCur: wonCur,
    dealsWonPrev: wonPrev,
    qualifiedPct: curPipe.qualifiedPct,
    revenueInsufficient: rf.meta.insufficientData,
    revenueCentralCad,
    revenueBandLabel,
    forecastConfidence,
    aiSparseTelemetry,
    brokerInsufficientUniform,
    scaleLeadDelta: scaleLead?.delta ?? null,
    scaleLeadBand: scaleLead?.outcomeBand ?? null,
    topCity,
    topCityScore,
    weakestCity,
    expansionSnippet,
    comparisonInsightLines,
    sparseBundle,
  };

  warnings.push(
    "Figures are operational snapshots — not audited financials, not GAAP revenue, not investment advice.",
  );

  return { metrics, warnings, missingDataAreas, narrativeInput };
}
