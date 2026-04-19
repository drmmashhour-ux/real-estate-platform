/**
 * Forward-looking revenue illustration only — uses stored CRM + activity rows, not cash or Stripe.
 */

import { prisma } from "@/lib/db";
import { buildExecutionAccountabilitySummary } from "@/modules/growth/execution-accountability.service";
import { logRevenueForecastBuilt, logRevenueForecastLowConfidence } from "@/modules/growth/revenue-forecast-monitoring.service";
import type {
  ForecastConfidence,
  RevenueForecast,
  RevenueForecastRevenue,
} from "@/modules/growth/revenue-forecast.types";
import { computeRevenueRisk } from "@/modules/growth/revenue-risk.service";
import { computeRevenueTrendMetrics } from "@/modules/growth/revenue-trend.service";

const MAX_WIN_RATE = 0.42;
const CONSERVATIVE_FACTOR = 0.62;
const OPTIMISTIC_CAP = 1.28;

function meanDealValue(values: number[]): number | null {
  if (!values.length) return null;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

async function leadWindowStats(start: Date, end: Date) {
  const rows = await prisma.lead.findMany({
    where: { createdAt: { gte: start, lt: end } },
    select: {
      pipelineStage: true,
      dealValue: true,
      estimatedValue: true,
    },
  });
  const leads = rows.length;
  const qualified = rows.filter((r) =>
    ["qualified", "meeting", "negotiation", "won"].includes(r.pipelineStage),
  ).length;
  const meetings = rows.filter((r) =>
    ["meeting", "negotiation", "won"].includes(r.pipelineStage),
  ).length;
  const vals: number[] = [];
  for (const r of rows) {
    const v = r.dealValue ?? r.estimatedValue;
    if (v != null && v > 0) vals.push(v);
  }
  return { rows, leads, qualified, meetings, vals };
}

async function wonCountSince(since: Date): Promise<number> {
  return prisma.lead.count({
    where: {
      pipelineStage: "won",
      updatedAt: { gte: since },
    },
  });
}

async function leadsCreatedSince(since: Date): Promise<number> {
  return prisma.lead.count({
    where: { createdAt: { gte: since } },
  });
}

export async function buildRevenueForecast(windowDays = 14): Promise<RevenueForecast> {
  const warnings: string[] = [];
  const until = new Date();
  const currentStart = new Date(until.getTime() - windowDays * 86400000);
  const priorStart = new Date(until.getTime() - 2 * windowDays * 86400000);

  const [cur, prev, accountability] = await Promise.all([
    leadWindowStats(currentStart, until),
    leadWindowStats(priorStart, currentStart),
    Promise.resolve(buildExecutionAccountabilitySummary()),
  ]);

  const avgFromWindow = meanDealValue(cur.vals);
  let avgDealValue = avgFromWindow;
  let avgDealValueSource = "mean(dealValue|estimatedValue) for leads created in window";

  if (avgDealValue == null) {
    const wonRows = await prisma.lead.findMany({
      where: {
        pipelineStage: "won",
        updatedAt: { gte: currentStart },
      },
      select: { dealValue: true, estimatedValue: true },
      take: 80,
    });
    const wvals = wonRows
      .map((r) => r.dealValue ?? r.estimatedValue)
      .filter((x): x is number => x != null && x > 0);
    avgDealValue = meanDealValue(wvals);
    avgDealValueSource = "mean deal/estimated value on recent won rows (fallback)";
  }

  const baselineDays = Math.max(windowDays * 4, 56);
  const baselineStart = new Date(until.getTime() - baselineDays * 86400000);
  const [wonB, enteredB] = await Promise.all([wonCountSince(baselineStart), leadsCreatedSince(baselineStart)]);
  const rawWinRate = enteredB > 0 ? wonB / enteredB : null;
  const winRate =
    rawWinRate == null ? null : Math.min(MAX_WIN_RATE, Math.max(0, Math.min(rawWinRate, MAX_WIN_RATE)));

  const dropOffRatio =
    cur.leads > 0 ? 1 - Math.min(1, cur.qualified / cur.leads) : cur.leads === 0 ? 0.8 : 0;

  const risk = computeRevenueRisk({
    leadsCount: cur.leads,
    dropOffRatio,
    executionCompletionRate: accountability.completionRate,
    sparsePipeline: cur.leads < 12,
    inconsistentSignals:
      cur.leads > 0 &&
      cur.qualified / cur.leads > 0.85 &&
      wonB === 0,
  });

  const trend = computeRevenueTrendMetrics({
    currentLeads: cur.leads,
    priorLeads: prev.leads,
    currentQualified: cur.qualified,
    priorQualified: prev.qualified,
  });

  let closingProbability: number | null = null;
  if (winRate != null && cur.leads >= 8) {
    closingProbability = Math.min(1, Math.max(0, winRate * (cur.qualified / Math.max(cur.leads, 1))));
  }

  let revenue: RevenueForecastRevenue = {
    expectedRevenue: null,
    conservativeEstimate: null,
    optimisticEstimate: null,
  };

  let insufficientData =
    avgDealValue == null || winRate == null || cur.leads < 6 || enteredB < 15;

  if (insufficientData) {
    warnings.push(
      "Insufficient CRM density — forecast ranges withheld until more leads and closed outcomes exist.",
    );
    logRevenueForecastLowConfidence("sparse-crm");
  } else {
    const central = cur.leads * winRate * avgDealValue;
    revenue = {
      expectedRevenue: Math.round(central),
      conservativeEstimate: Math.round(central * CONSERVATIVE_FACTOR),
      optimisticEstimate: Math.round(Math.min(central * OPTIMISTIC_CAP, cur.leads * avgDealValue * MAX_WIN_RATE)),
    };
    warnings.push(
      "Illustrative only — based on historical stage counts, not contracted revenue or cash timing.",
    );
    warnings.push("Does not imply causation between Growth panels and financial outcomes.");
  }

  let confidence: ForecastConfidence = "low";
  if (!insufficientData && cur.leads >= 35 && enteredB >= 60) confidence = "high";
  else if (!insufficientData && cur.leads >= 18) confidence = "medium";

  if (risk.dataRisk === "high") {
    confidence = confidence === "high" ? "medium" : "low";
    logRevenueForecastLowConfidence("data-risk-high");
  }

  void logRevenueForecastBuilt({
    windowDays,
    sufficient: !insufficientData,
    confidence,
  });

  return {
    windowDays,
    pipeline: {
      leads: cur.leads,
      qualified: cur.qualified,
      meetings: cur.meetings,
      closingProbability,
    },
    revenue,
    trend,
    risk,
    meta: {
      confidence,
      warnings,
      insufficientData,
      avgDealValueSource,
    },
  };
}
