/**
 * Read-only baseline for growth simulations — no writes.
 */

import { growthDailyBriefFlags, growthGovernanceFlags, growthStrategyFlags } from "@/config/feature-flags";
import { buildGrowthDailyBrief } from "./growth-daily-brief.service";
import { buildGrowthExecutiveSummary } from "./growth-executive.service";
import { evaluateGrowthGovernance } from "./growth-governance.service";
import { fetchEarlyConversionAdsSnapshot, computePaidFunnelAdsInsights } from "./growth-ai-analyzer.service";
import { buildGrowthStrategyBundle } from "./growth-strategy.service";
import type { GrowthSimulationBaseline } from "./growth-simulation.types";

export async function buildGrowthSimulationBaseline(): Promise<GrowthSimulationBaseline> {
  const missingDataWarnings: string[] = [];

  let executive: Awaited<ReturnType<typeof buildGrowthExecutiveSummary>> | null = null;
  try {
    executive = await buildGrowthExecutiveSummary();
  } catch {
    missingDataWarnings.push("executive_unavailable");
  }

  let dailyBrief: Awaited<ReturnType<typeof buildGrowthDailyBrief>> | null = null;
  if (growthDailyBriefFlags.growthDailyBriefV1) {
    try {
      dailyBrief = await buildGrowthDailyBrief();
    } catch {
      missingDataWarnings.push("daily_brief_unavailable");
    }
  }

  let governance: Awaited<ReturnType<typeof evaluateGrowthGovernance>> | null = null;
  if (growthGovernanceFlags.growthGovernanceV1) {
    try {
      governance = await evaluateGrowthGovernance();
    } catch {
      missingDataWarnings.push("governance_unavailable");
    }
  }

  let strategyTopPriority: string | undefined;
  if (growthStrategyFlags.growthStrategyV1) {
    try {
      const bundle = await buildGrowthStrategyBundle();
      strategyTopPriority = bundle?.weeklyPlan.topPriority ?? undefined;
    } catch {
      missingDataWarnings.push("strategy_unavailable");
    }
  }

  let leadsTodayEarly = 0;
  let adsPerformance: "WEAK" | "OK" | "STRONG" = executive?.campaignSummary.adsPerformance ?? "OK";
  try {
    const early = await fetchEarlyConversionAdsSnapshot();
    leadsTodayEarly = early?.leadsToday ?? 0;
    if (!executive) {
      adsPerformance = computePaidFunnelAdsInsights(early).health;
    }
  } catch {
    missingDataWarnings.push("early_conversion_unavailable");
  }

  return {
    leadsTotal: executive?.leadSummary.totalLeads ?? 0,
    hotLeads: executive?.leadSummary.hotLeads ?? 0,
    dueNow: executive?.leadSummary.dueNow ?? 0,
    leadsTodayEarly,
    topCampaign: executive?.campaignSummary.topCampaign,
    adsPerformance,
    executiveStatus: executive?.status,
    governanceStatus: governance?.status,
    strategyTopPriority,
    briefFocus: dailyBrief?.today?.focus ?? undefined,
    missingDataWarnings,
  };
}
