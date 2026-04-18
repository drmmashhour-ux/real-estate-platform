/**
 * Growth Mission Control — read-only aggregation; no execution or source mutations.
 */

import {
  growthDailyBriefFlags,
  growthDecisionJournalFlags,
  growthFusionFlags,
  growthGovernanceFlags,
  growthKnowledgeGraphFlags,
  growthMemoryFlags,
  growthMissionControlFlags,
  growthSimulationFlags,
  growthStrategyFlags,
} from "@/config/feature-flags";
import { buildGrowthKnowledgeGraph } from "./growth-knowledge-graph.service";
import { buildKnowledgeGraphInsights } from "./growth-knowledge-graph-bridge.service";
import { coordinateGrowthAgents } from "./growth-agent-coordinator.service";
import { buildGrowthFusionSystem } from "./growth-fusion.service";
import { buildGrowthMemoryMissionNotes } from "./growth-memory-mission-control-bridge.service";
import { buildGrowthMemorySummary } from "./growth-memory.service";
import { loadResponseDeskCadenceHints } from "./growth-cadence-response-desk.loader";
import { buildGrowthDailyBrief } from "./growth-daily-brief.service";
import { buildGrowthExecutiveSummary } from "./growth-executive.service";
import { evaluateGrowthGovernance } from "./growth-governance.service";
import { getGrowthLearningReadOnlyForCadence } from "./growth-learning.service";
import { buildGrowthMissionChecklist } from "./growth-mission-control-checklist.service";
import { resolveGrowthMissionFocus } from "./growth-mission-control-focus.service";
import {
  logGrowthMissionControlBuildStarted,
  recordGrowthMissionControlBuild,
} from "./growth-mission-control-monitoring.service";
import { buildGrowthMissionReviewQueue } from "./growth-mission-control-review.service";
import { buildGrowthMissionRisks } from "./growth-mission-control-risk.service";
import { computeGrowthMissionControlStatus } from "./growth-mission-control-status.service";
import type {
  GrowthMissionControlBuildContext,
  GrowthMissionControlSummary,
} from "./growth-mission-control.types";
import { buildGrowthSimulationBundle } from "./growth-simulation.service";
import { buildGrowthStrategyBundle } from "./growth-strategy.service";

function formatSimulationRecommendation(ctx: GrowthMissionControlBuildContext): string | undefined {
  const scenarios = ctx.simulationBundle?.scenarios;
  if (!scenarios?.length) return undefined;
  const pick = scenarios.find((s) => s.recommendation === "consider") ?? scenarios[0];
  return `${pick.title}: ${pick.recommendation} (estimate, not guaranteed)`;
}

function normNoteKey(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ")
    .slice(0, 96);
}

function buildRefinedMissionNotes(
  ctx: GrowthMissionControlBuildContext,
  view: {
    missionFocusTitle?: string;
    checklist: string[];
    riskTitles: string[];
  },
): string[] {
  const notes: string[] = [];
  const skip = new Set<string>();
  for (const x of [view.missionFocusTitle, ...view.checklist, ...view.riskTitles]) {
    const t = x?.trim();
    if (t) skip.add(normNoteKey(t));
  }

  if (ctx.missingDataWarnings.length) {
    notes.push(`Partial data — ${ctx.missingDataWarnings.slice(0, 3).join("; ")}`);
  }

  const lc = ctx.learningControl;
  if (lc?.state === "monitor") {
    const line = "Learning control: monitor mode — review adaptive signals before trusting weight shifts.";
    if (!skip.has(normNoteKey(line))) notes.push(line);
  }

  const deferScen = ctx.simulationBundle?.scenarios?.filter((s) => s.recommendation === "defer") ?? [];
  if (deferScen.length > 0) {
    const line = `Simulations suggest deferring some scenarios (${deferScen
      .slice(0, 2)
      .map((s) => s.title)
      .join(", ")}) — estimates only.`;
    if (!skip.has(normNoteKey(line))) notes.push(line);
  }

  if (ctx.governance?.status === "freeze_recommended") {
    const line = "Governance recommends freeze — review before expanding automated execution.";
    if (!skip.has(normNoteKey(line))) notes.push(line);
  }

  if (ctx.executive?.campaignSummary.adsPerformance === "WEAK") {
    const line = "Hold paid scale until conversion signals improve (executive band is weak).";
    if (!skip.has(normNoteKey(line))) notes.push(line);
  }

  if (ctx.fusion?.summary.status === "weak") {
    const line = "Fusion band weak — cross-check source panels before broad moves.";
    if (!skip.has(normNoteKey(line))) notes.push(line);
  }

  return notes.slice(0, 6);
}

function mergeSupplementalNotes(base: string[], extra: string[], avoidLines: string[]): string[] {
  const seen = new Set(avoidLines.map((x) => normNoteKey(x)));
  for (const b of base) seen.add(normNoteKey(b));
  const out = [...base];
  for (const line of extra) {
    const t = line.trim();
    if (!t) continue;
    const k = normNoteKey(t);
    if (seen.has(k)) continue;
    seen.add(k);
    out.push(t);
    if (out.length >= 6) break;
  }
  return out.slice(0, 6);
}

function buildMissionControlParts(ctx: GrowthMissionControlBuildContext): {
  summary: GrowthMissionControlSummary;
  checklistDedupeEvents: number;
  riskDedupeEvents: number;
  reviewDedupeEvents: number;
} {
  const missionFocus = resolveGrowthMissionFocus(ctx);
  const checklist = buildGrowthMissionChecklist(ctx, { missionFocusTitle: missionFocus.title });
  const risks = buildGrowthMissionRisks(ctx);
  const review = buildGrowthMissionReviewQueue(ctx);
  const status = computeGrowthMissionControlStatus({
    governance: ctx.governance,
    executive: ctx.executive,
    dailyBrief: ctx.dailyBrief,
    mergedRisks: risks.risks,
  });

  const blocked = (ctx.governance?.blockedDomains ?? []).map(String);
  const frozen = (ctx.governance?.frozenDomains ?? []).map(String);

  const notes = buildRefinedMissionNotes(ctx, {
    missionFocusTitle: missionFocus.title,
    checklist: checklist.items,
    riskTitles: risks.risks.map((r) => r.title),
  });

  const summary: GrowthMissionControlSummary = {
    status,
    missionFocus,
    todayChecklist: checklist.items,
    topRisks: risks.risks,
    strategyFocus: ctx.strategyBundle?.weeklyPlan.topPriority,
    simulationRecommendation: formatSimulationRecommendation(ctx),
    humanReviewQueue: review.items,
    blockedDomains: blocked,
    frozenDomains: frozen,
    notes,
    createdAt: new Date().toISOString(),
  };

  return {
    summary,
    checklistDedupeEvents: checklist.dedupeEvents,
    riskDedupeEvents: risks.dedupeEvents,
    reviewDedupeEvents: review.dedupeEvents,
  };
}

export function assembleGrowthMissionControlSummary(ctx: GrowthMissionControlBuildContext): GrowthMissionControlSummary {
  return buildMissionControlParts(ctx).summary;
}

function mergeBuildContext(
  base: GrowthMissionControlBuildContext,
  inject?: Partial<GrowthMissionControlBuildContext>,
): GrowthMissionControlBuildContext {
  if (!inject) return base;
  const out: GrowthMissionControlBuildContext = { ...base };
  for (const [k, v] of Object.entries(inject) as [keyof GrowthMissionControlBuildContext, unknown][]) {
    if (v !== undefined) (out as Record<string, unknown>)[k as string] = v;
  }
  return out;
}

/** Shared loader for Mission Control and Decision Journal (same snapshot; no appended notes). */
export async function loadGrowthMissionControlBuildContext(
  inject?: Partial<GrowthMissionControlBuildContext>,
): Promise<{
  ctx: GrowthMissionControlBuildContext;
  missingDataWarnings: string[];
}> {
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

  let fusion: GrowthMissionControlBuildContext["fusion"] = inject?.fusion ?? null;
  if (!fusion && growthFusionFlags.growthFusionV1) {
    try {
      const sys = await buildGrowthFusionSystem();
      if (sys) fusion = { summary: sys.summary, actions: sys.actions };
    } catch {
      missingDataWarnings.push("fusion_unavailable");
    }
  }

  let coordination: Awaited<ReturnType<typeof coordinateGrowthAgents>> | null = null;
  try {
    coordination = await coordinateGrowthAgents();
  } catch {
    missingDataWarnings.push("coordination_unavailable");
  }

  let strategyBundle: Awaited<ReturnType<typeof buildGrowthStrategyBundle>> | null = null;
  if (growthStrategyFlags.growthStrategyV1) {
    try {
      strategyBundle = await buildGrowthStrategyBundle();
    } catch {
      missingDataWarnings.push("strategy_unavailable");
    }
  }

  let simulationBundle: Awaited<ReturnType<typeof buildGrowthSimulationBundle>> | null = null;
  if (growthSimulationFlags.growthSimulationV1) {
    try {
      simulationBundle = await buildGrowthSimulationBundle();
    } catch {
      missingDataWarnings.push("simulation_unavailable");
    }
  }

  let learningControl: GrowthMissionControlBuildContext["learningControl"] = null;
  try {
    const lr = await getGrowthLearningReadOnlyForCadence();
    learningControl = lr?.learningControl ?? null;
  } catch {
    missingDataWarnings.push("learning_unavailable");
  }

  let responseDesk: Awaited<ReturnType<typeof loadResponseDeskCadenceHints>> = null;
  try {
    responseDesk = await loadResponseDeskCadenceHints();
  } catch {
    missingDataWarnings.push("response_desk_unavailable");
  }

  const autopilotFocusTitle = executive?.autopilot?.focusTitle?.trim() ?? null;

  const ctx: GrowthMissionControlBuildContext = mergeBuildContext(
    {
      executive,
      dailyBrief,
      governance,
      fusion,
      coordination,
      strategyBundle,
      simulationBundle,
      learningControl,
      responseDesk,
      autopilotFocusTitle,
      missingDataWarnings,
    },
    inject,
  );

  return { ctx, missingDataWarnings };
}

export async function buildGrowthMissionControlSummary(options?: {
  inject?: Partial<GrowthMissionControlBuildContext>;
}): Promise<GrowthMissionControlSummary | null> {
  if (!growthMissionControlFlags.growthMissionControlV1) {
    return null;
  }

  logGrowthMissionControlBuildStarted();
  const { ctx, missingDataWarnings } = await loadGrowthMissionControlBuildContext(options?.inject);

  const parts = buildMissionControlParts(ctx);
  let summary = parts.summary;

  const missionAvoid = [
    summary.missionFocus?.title,
    ...summary.todayChecklist,
    ...summary.topRisks.map((r) => r.title),
  ].filter(Boolean) as string[];

  let memoryLines: string[] = options?.inject?.prefetchedMemoryNotes?.length
    ? (options.inject.prefetchedMemoryNotes ?? []).slice(0, 4)
    : [];
  if (!memoryLines.length && growthMemoryFlags.growthMemoryV1) {
    try {
      const mem = await buildGrowthMemorySummary();
      if (mem) memoryLines = buildGrowthMemoryMissionNotes(mem).slice(0, 4);
    } catch {
      /* advisory only */
    }
  }

  let graphLines: string[] = options?.inject?.prefetchedGraphInsights?.length
    ? (options.inject.prefetchedGraphInsights ?? []).slice(0, 3)
    : [];
  if (
    !graphLines.length &&
    growthKnowledgeGraphFlags.growthKnowledgeGraphV1 &&
    growthKnowledgeGraphFlags.growthKnowledgeGraphBridgeV1
  ) {
    try {
      const kg = await buildGrowthKnowledgeGraph();
      if (kg) graphLines = buildKnowledgeGraphInsights(kg).slice(0, 2);
    } catch {
      /* advisory only */
    }
  }

  let journalLines: string[] = ctx.prefetchedJournalInsights?.length
    ? ctx.prefetchedJournalInsights.slice(0, 3)
    : [];
  if (
    !journalLines.length &&
    growthDecisionJournalFlags.growthDecisionJournalV1 &&
    growthDecisionJournalFlags.growthDecisionJournalBridgeV1
  ) {
    try {
      const { listAutopilotActionsWithStatus } = await import("./ai-autopilot-api.helpers");
      const { buildGrowthDecisionJournalInsights } = await import("./growth-decision-journal-bridge.service");
      const { buildGrowthDecisionJournalFromMissionParts } = await import("./growth-decision-journal.service");
      const ap = await listAutopilotActionsWithStatus();
      const dj = buildGrowthDecisionJournalFromMissionParts(ctx, summary, ap);
      journalLines = buildGrowthDecisionJournalInsights(dj).slice(0, 2);
    } catch {
      /* advisory only */
    }
  }

  let merged = summary.notes;
  merged = mergeSupplementalNotes(merged, memoryLines, missionAvoid);
  merged = mergeSupplementalNotes(merged, graphLines, [...missionAvoid, ...merged]);
  merged = mergeSupplementalNotes(merged, journalLines, [...missionAvoid, ...merged]);
  summary = { ...summary, notes: merged };

  const dedupeEvents =
    parts.checklistDedupeEvents + parts.riskDedupeEvents + parts.reviewDedupeEvents;

  recordGrowthMissionControlBuild({
    status: summary.status,
    missionFocusTitle: summary.missionFocus?.title,
    checklistCount: summary.todayChecklist.length,
    riskCount: summary.topRisks.length,
    reviewCount: summary.humanReviewQueue.length,
    missingDataWarningCount: missingDataWarnings.length,
    dedupeEvents,
    noteCount: summary.notes.length,
  });

  return summary;
}
