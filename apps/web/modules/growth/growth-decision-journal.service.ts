/**
 * Growth Decision Journal — read-only assembly; no persistence; no execution.
 */

import { growthDecisionJournalFlags } from "@/config/feature-flags";
import { listAutopilotActionsWithStatus } from "./ai-autopilot-api.helpers";
import type { GrowthDecisionJournalBuildInput } from "./growth-decision-journal-build-input.types";
import { buildGrowthDecisionJournalEntries } from "./growth-decision-journal-entries.service";
import { buildGrowthDecisionJournalReflections } from "./growth-decision-journal-reflection.service";
import {
  logGrowthDecisionJournalBuildStarted,
  recordGrowthDecisionJournalBuild,
} from "./growth-decision-journal-monitoring.service";
import type {
  GrowthDecisionJournalReflectionSignals,
  GrowthDecisionJournalStats,
  GrowthDecisionJournalSummary,
} from "./growth-decision-journal.types";
import type { GrowthMissionControlBuildContext, GrowthMissionControlSummary } from "./growth-mission-control.types";
import {
  assembleGrowthMissionControlSummary,
  loadGrowthMissionControlBuildContext,
} from "./growth-mission-control.service";

function computeJournalStats(
  entries: GrowthDecisionJournalSummary["entries"],
  reflections: GrowthDecisionJournalSummary["reflections"],
): GrowthDecisionJournalStats {
  return {
    recommendedCount: entries.filter((e) => e.decision === "recommended").length,
    approvedCount: entries.filter((e) => e.decision === "approved").length,
    rejectedCount: entries.filter((e) => e.decision === "rejected").length,
    executedCount: entries.filter((e) => e.decision === "executed").length,
    deferredCount: entries.filter((e) => e.decision === "deferred").length,
    reviewRequiredCount: entries.filter((e) => e.decision === "review_required").length,
    positiveOutcomeCount: reflections.filter((r) => r.outcome === "positive").length,
    negativeOutcomeCount: reflections.filter((r) => r.outcome === "negative").length,
    neutralOutcomeCount: reflections.filter((r) => r.outcome === "neutral").length,
  };
}

/**
 * Pure assembly for tests and deterministic validation.
 */
export function assembleGrowthDecisionJournalSummary(
  input: GrowthDecisionJournalBuildInput,
  signals: GrowthDecisionJournalReflectionSignals,
): GrowthDecisionJournalSummary {
  const entries = buildGrowthDecisionJournalEntries(input);
  const reflections = buildGrowthDecisionJournalReflections(entries, signals);
  const stats = computeJournalStats(entries, reflections);
  return {
    entries,
    reflections,
    stats,
    createdAt: new Date().toISOString(),
  };
}

function reflectionSignalsFromContext(
  ctx: GrowthMissionControlBuildContext,
  missionSummary: GrowthMissionControlSummary,
): GrowthDecisionJournalReflectionSignals {
  return {
    adsPerformance: ctx.executive?.campaignSummary.adsPerformance ?? "OK",
    governanceStatus: ctx.governance?.status ?? null,
    executiveStatus: ctx.executive?.status ?? null,
    missionStatus: missionSummary.status,
    hotLeads: ctx.executive?.leadSummary.hotLeads ?? 0,
    dueNow: ctx.executive?.leadSummary.dueNow ?? 0,
  };
}

/**
 * Builds a journal from an already-assembled Mission Control context (avoids recursive MC calls).
 */
export function buildGrowthDecisionJournalFromMissionParts(
  ctx: GrowthMissionControlBuildContext,
  missionSummary: GrowthMissionControlSummary,
  autopilot: GrowthDecisionJournalBuildInput["autopilot"],
): GrowthDecisionJournalSummary {
  const input: GrowthDecisionJournalBuildInput = {
    autopilot,
    executive: ctx.executive,
    governance: ctx.governance,
    strategyBundle: ctx.strategyBundle,
    simulationBundle: ctx.simulationBundle,
    missionControl: missionSummary,
    dailyBrief: ctx.dailyBrief,
    coordination: ctx.coordination,
    missingDataWarnings: [...ctx.missingDataWarnings],
  };
  return assembleGrowthDecisionJournalSummary(input, reflectionSignalsFromContext(ctx, missionSummary));
}

export async function buildGrowthDecisionJournalSummary(): Promise<GrowthDecisionJournalSummary | null> {
  if (!growthDecisionJournalFlags.growthDecisionJournalV1) {
    return null;
  }

  logGrowthDecisionJournalBuildStarted();
  const extraWarn: string[] = [];

  let autopilot: GrowthDecisionJournalBuildInput["autopilot"] = null;
  try {
    autopilot = await listAutopilotActionsWithStatus();
  } catch {
    extraWarn.push("autopilot_unavailable");
  }

  const { ctx } = await loadGrowthMissionControlBuildContext();
  const missionSummary = assembleGrowthMissionControlSummary(ctx);
  const input: GrowthDecisionJournalBuildInput = {
    autopilot,
    executive: ctx.executive,
    governance: ctx.governance,
    strategyBundle: ctx.strategyBundle,
    simulationBundle: ctx.simulationBundle,
    missionControl: missionSummary,
    dailyBrief: ctx.dailyBrief,
    coordination: ctx.coordination,
    missingDataWarnings: [...ctx.missingDataWarnings, ...extraWarn],
  };

  const summary = assembleGrowthDecisionJournalSummary(input, reflectionSignalsFromContext(ctx, missionSummary));

  const unknownOutcomeCount = summary.reflections.filter(
    (r) => r.outcome === "unknown" || r.outcome === "insufficient_data",
  ).length;

  recordGrowthDecisionJournalBuild({
    entryCount: summary.entries.length,
    reflectionCount: summary.reflections.length,
    stats: {
      positiveOutcomeCount: summary.stats.positiveOutcomeCount,
      negativeOutcomeCount: summary.stats.negativeOutcomeCount,
      unknownOutcomeCount,
    },
    missingDataWarningCount: input.missingDataWarnings.length,
  });

  return summary;
}
