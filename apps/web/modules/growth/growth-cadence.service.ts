/**
 * Growth operating cadence bundle — read-only orchestration; no execution or source mutations.
 */

import {
  growthDailyBriefFlags,
  growthCadenceFlags,
  growthGovernanceFlags,
} from "@/config/feature-flags";
import { coordinateGrowthAgents } from "./growth-agent-coordinator.service";
import { buildGrowthDailyBrief } from "./growth-daily-brief.service";
import { buildGrowthExecutiveSummary } from "./growth-executive.service";
import { evaluateGrowthGovernance } from "./growth-governance.service";
import { getGrowthLearningReadOnlyForCadence } from "./growth-learning.service";
import { buildGrowthStrategyBundle } from "./growth-strategy.service";
import { composeGrowthCadenceBundle } from "./growth-cadence-compose.service";
import type { GrowthDailyCadenceInput } from "./growth-cadence-daily.service";
import type { GrowthWeeklyCadenceInput } from "./growth-cadence-weekly.service";
import {
  logGrowthCadenceBuildStarted,
  recordGrowthCadenceBuild,
} from "./growth-cadence-monitoring.service";
import { loadResponseDeskCadenceHints } from "./growth-cadence-response-desk.loader";
import type { GrowthCadenceBundle } from "./growth-cadence.types";
export type { GrowthDailyCadenceInput } from "./growth-cadence-daily.service";
export type { GrowthWeeklyCadenceInput } from "./growth-cadence-weekly.service";
export { composeGrowthCadenceBundle } from "./growth-cadence-compose.service";

/**
 * Assembles cadence from existing growth modules — advisory only.
 */
export async function buildGrowthCadenceBundle(): Promise<GrowthCadenceBundle | null> {
  if (!growthCadenceFlags.growthCadenceV1) {
    return null;
  }

  logGrowthCadenceBuildStarted();
  const missingDataWarnings: string[] = [];

  let executive: Awaited<ReturnType<typeof buildGrowthExecutiveSummary>> | null = null;
  try {
    executive = await buildGrowthExecutiveSummary();
  } catch {
    missingDataWarnings.push("executive_unavailable");
  }

  let dailyBrief: GrowthDailyCadenceInput["dailyBrief"] = null;
  if (growthDailyBriefFlags.growthDailyBriefV1) {
    try {
      dailyBrief = await buildGrowthDailyBrief();
    } catch {
      missingDataWarnings.push("daily_brief_unavailable");
    }
  }

  let governance: GrowthDailyCadenceInput["governance"] = null;
  if (growthGovernanceFlags.growthGovernanceV1) {
    try {
      governance = await evaluateGrowthGovernance();
    } catch {
      missingDataWarnings.push("governance_unavailable");
    }
  }

  let coordination: GrowthDailyCadenceInput["coordination"] = null;
  try {
    coordination = await coordinateGrowthAgents();
  } catch {
    missingDataWarnings.push("coordination_unavailable");
  }

  let strategyBundle: GrowthWeeklyCadenceInput["strategyBundle"] = null;
  try {
    strategyBundle = await buildGrowthStrategyBundle();
  } catch {
    missingDataWarnings.push("strategy_unavailable");
  }

  let learningRead: Awaited<ReturnType<typeof getGrowthLearningReadOnlyForCadence>> = null;
  try {
    learningRead = await getGrowthLearningReadOnlyForCadence();
  } catch {
    missingDataWarnings.push("learning_unavailable");
  }

  let responseDesk: GrowthDailyCadenceInput["responseDesk"] = null;
  try {
    responseDesk = await loadResponseDeskCadenceHints();
  } catch {
    missingDataWarnings.push("response_desk_unavailable");
  }

  const dailyInput: GrowthDailyCadenceInput = {
    dailyBrief,
    executive,
    coordination,
    governance,
    learningControl: learningRead?.learningControl ?? null,
    responseDesk,
    strategyTopPriority: strategyBundle?.weeklyPlan.topPriority,
    missingDataWarnings,
  };

  const weeklyInput: GrowthWeeklyCadenceInput = {
    strategyBundle,
    executive,
    learningSummary: learningRead?.summary ?? null,
    governance,
    learningControl: learningRead?.learningControl ?? null,
  };

  const bundle = composeGrowthCadenceBundle(dailyInput, weeklyInput);

  recordGrowthCadenceBuild({
    status: bundle.daily.status,
    focus: bundle.daily.focus,
    checklistCount: bundle.daily.checklist.length,
    riskCount: bundle.daily.risks.length,
    missingDataWarningCount: missingDataWarnings.length,
  });

  return bundle;
}
