/**
 * Growth strategy bundle — read-only aggregation; no execution or writes.
 */

import {
  growthDailyBriefFlags,
  growthFusionFlags,
  growthGovernanceFlags,
  growthMemoryFlags,
  growthStrategyFlags,
} from "@/config/feature-flags";
import { listAutopilotActionsWithStatus } from "./ai-autopilot-api.helpers";
import { coordinateGrowthAgents } from "./growth-agent-coordinator.service";
import { buildGrowthDailyBrief } from "./growth-daily-brief.service";
import { buildGrowthExecutiveSummary } from "./growth-executive.service";
import { analyzeGrowthFusion } from "./growth-fusion-analyzer.service";
import { buildGrowthFusionSnapshot } from "./growth-fusion-snapshot.service";
import { fetchEarlyConversionAdsSnapshot } from "./growth-ai-analyzer.service";
import { evaluateGrowthGovernance } from "./growth-governance.service";
import { composeGrowthStrategyBundleFromSnapshot } from "./growth-strategy-compose.service";
import {
  logGrowthStrategyBuildStarted,
  recordGrowthStrategyBuild,
} from "./growth-strategy-monitoring.service";
import { applyGrowthMemoryToPriorities } from "./growth-memory-priority-bridge.service";
import { buildGrowthMemorySummary } from "./growth-memory.service";
import type { GrowthStrategyBundle, GrowthStrategySourceSnapshot } from "./growth-strategy.types";

export { composeGrowthStrategyBundleFromSnapshot } from "./growth-strategy-compose.service";

export async function assembleGrowthStrategySourceSnapshot(): Promise<GrowthStrategySourceSnapshot> {
  const missingDataWarnings: string[] = [];

  let executive: GrowthStrategySourceSnapshot["executive"] = null;
  try {
    executive = await buildGrowthExecutiveSummary();
  } catch {
    missingDataWarnings.push("executive_unavailable");
  }

  let dailyBrief: GrowthStrategySourceSnapshot["dailyBrief"] = null;
  if (growthDailyBriefFlags.growthDailyBriefV1) {
    try {
      dailyBrief = await buildGrowthDailyBrief();
    } catch {
      missingDataWarnings.push("daily_brief_unavailable");
    }
  }

  let governance: GrowthStrategySourceSnapshot["governance"] = null;
  if (growthGovernanceFlags.growthGovernanceV1) {
    try {
      governance = await evaluateGrowthGovernance();
    } catch {
      missingDataWarnings.push("governance_unavailable");
    }
  }

  let fusionSummary: GrowthStrategySourceSnapshot["fusionSummary"] = null;
  if (growthFusionFlags.growthFusionV1) {
    try {
      const raw = await buildGrowthFusionSnapshot();
      fusionSummary = analyzeGrowthFusion(raw);
    } catch {
      missingDataWarnings.push("fusion_unavailable");
    }
  }

  let coordination: GrowthStrategySourceSnapshot["coordination"] = null;
  try {
    coordination = await coordinateGrowthAgents();
  } catch {
    missingDataWarnings.push("coordination_unavailable");
  }

  let autopilotTopActions: GrowthStrategySourceSnapshot["autopilotTopActions"] = [];
  try {
    const ap = await listAutopilotActionsWithStatus();
    autopilotTopActions = ap.actions.slice(0, 5).map((a) => ({
      title: a.title,
      priorityScore: a.priorityScore,
      impact: a.impact,
    }));
  } catch {
    missingDataWarnings.push("autopilot_unavailable");
  }

  const adsHealth = executive?.campaignSummary.adsPerformance ?? "OK";
  const dueNowCount = executive?.leadSummary.dueNow ?? 0;
  const hotLeadCount = executive?.leadSummary.hotLeads ?? 0;

  let leadsTodayEarly = 0;
  try {
    const early = await fetchEarlyConversionAdsSnapshot();
    leadsTodayEarly = early?.leadsToday ?? 0;
  } catch {
    missingDataWarnings.push("early_conversion_unavailable");
  }

  return {
    executive,
    dailyBrief,
    governance,
    fusionSummary,
    coordination,
    autopilotTopActions,
    dueNowCount,
    hotLeadCount,
    leadsTodayEarly,
    adsHealth,
    missingDataWarnings,
  };
}

/**
 * Builds one advisory strategy bundle. Returns null when strategy feature is off.
 */
export async function buildGrowthStrategyBundle(): Promise<GrowthStrategyBundle | null> {
  if (!growthStrategyFlags.growthStrategyV1) {
    return null;
  }

  logGrowthStrategyBuildStarted();
  const snapshot = await assembleGrowthStrategySourceSnapshot();

  let bundle = composeGrowthStrategyBundleFromSnapshot(snapshot, {
    experimentsEnabled: growthStrategyFlags.growthStrategyExperimentsV1,
    roadmapEnabled: growthStrategyFlags.growthStrategyRoadmapV1,
  });

  if (growthMemoryFlags.growthMemoryV1 && growthMemoryFlags.growthMemoryPriorityBridgeV1) {
    try {
      const mem = await buildGrowthMemorySummary({ preloadedStrategyBundle: bundle });
      if (mem) {
        const bridged = applyGrowthMemoryToPriorities({ priorities: bundle.weeklyPlan.priorities }, mem);
        bundle = {
          ...bundle,
          weeklyPlan: {
            ...bundle.weeklyPlan,
            priorities: bridged.priorities,
          },
        };
      }
    } catch {
      /* memory bridge is optional */
    }
  }

  recordGrowthStrategyBuild({
    status: bundle.weeklyPlan.status,
    topPriority: bundle.weeklyPlan.topPriority,
    priorityCount: bundle.weeklyPlan.priorities.length,
    experimentCount: bundle.weeklyPlan.experiments.length,
    roadmapCount: bundle.weeklyPlan.roadmap.length,
    missingDataWarningCount: snapshot.missingDataWarnings.length,
  });

  return bundle;
}
