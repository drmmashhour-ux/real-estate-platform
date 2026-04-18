/**
 * Weekly operating review — read-only aggregation; no writes to source systems.
 */

import {
  growthDailyBriefFlags,
  growthGovernanceFlags,
  growthLearningFlags,
  growthMemoryFlags,
  growthMultiAgentFlags,
  growthPolicyEnforcementFlags,
  growthSimulationFlags,
  growthStrategyFlags,
  growthOperatingReviewFlags,
} from "@/config/feature-flags";
import { prisma } from "@/lib/db";
import { buildFollowUpQueue, leadRowToFollowUpInput } from "./ai-autopilot-followup.service";
import { listAutopilotActionsWithStatus } from "./ai-autopilot-api.helpers";
import { coordinateGrowthAgents } from "./growth-agent-coordinator.service";
import { buildGrowthDailyBrief } from "./growth-daily-brief.service";
import { buildGrowthExecutiveSummary } from "./growth-executive.service";
import { evaluateGrowthGovernance } from "./growth-governance.service";
import { buildGrowthMemorySummary } from "./growth-memory.service";
import { buildGrowthPolicyEnforcementSnapshot } from "./growth-policy-enforcement.service";
import { buildGrowthSimulationBundle } from "./growth-simulation.service";
import { buildGrowthStrategyBundle } from "./growth-strategy.service";
import { buildDidntWorkItems, buildBlockedItems, buildDeferredItems } from "./growth-operating-review-challenges.service";
import { buildWorkedItems } from "./growth-operating-review-worked.service";
import { buildNextWeekChangeItems } from "./growth-operating-review-next-week.service";
import {
  logGrowthOperatingReviewBuildStarted,
  recordGrowthOperatingReviewBuild,
} from "./growth-operating-review-monitoring.service";
import type {
  GrowthOperatingReviewBuildInput,
  GrowthOperatingReviewStatus,
  GrowthOperatingReviewSummary,
} from "./growth-operating-review.types";

/** ISO week label e.g. 2026-W14 — deterministic for a given instant. */
export function formatIsoWeekLabel(d: Date): string {
  const t = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  const dayNum = t.getUTCDay() || 7;
  t.setUTCDate(t.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(t.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil(((t.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return `${t.getUTCFullYear()}-W${String(weekNo).padStart(2, "0")}`;
}

export function deriveGrowthOperatingReviewStatus(args: {
  worked: number;
  didntWork: number;
  blocked: number;
  deferred: number;
  nextWeekChangeCount: number;
}): GrowthOperatingReviewStatus {
  const W = args.worked;
  const D = args.didntWork;
  const B = args.blocked;
  const Def = args.deferred;
  const N = args.nextWeekChangeCount;

  if (Def >= 4) return "watch";
  if (D + B >= 4 && W <= 1) return "weak";
  if (D >= 3 && W === 0 && B >= 1) return "weak";
  if (W >= 2 && B <= 1 && D <= 1 && Def <= 2 && N >= 1) return "strong";
  if (W >= 1 && D + B <= 3 && Def <= 3) return "healthy";
  if (D >= 2 && B >= 2) return "watch";
  if (Def >= 3) return "watch";
  if (D + B >= 3 && W === 0) return "weak";
  return "watch";
}

function buildAdvisoryNotes(
  input: GrowthOperatingReviewBuildInput,
  status: GrowthOperatingReviewStatus,
): string[] {
  const notes: string[] = [];
  notes.push("Advisory synthesis only — humans set priorities; no auto-execution.");
  if (input.missingDataWarnings.length) {
    notes.push(`Partial inputs: ${input.missingDataWarnings.slice(0, 6).join("; ")}`);
  }
  if (status === "weak") {
    notes.push("Signals skew negative — treat next-week suggestions as conservative triage, not verdicts.");
  } else if (status === "strong") {
    notes.push("Signals skew positive — still validate externally before scaling spend or automation.");
  }
  return notes.slice(0, 10);
}

export function assembleGrowthOperatingReviewSummary(input: GrowthOperatingReviewBuildInput): GrowthOperatingReviewSummary {
  const worked = buildWorkedItems(input);
  const didntWork = buildDidntWorkItems(input);
  const blocked = buildBlockedItems(input);
  const deferred = buildDeferredItems(input);
  const nextWeekChanges = buildNextWeekChangeItems(input);
  const status = deriveGrowthOperatingReviewStatus({
    worked: worked.length,
    didntWork: didntWork.length,
    blocked: blocked.length,
    deferred: deferred.length,
    nextWeekChangeCount: nextWeekChanges.length,
  });
  const notes = buildAdvisoryNotes(input, status);
  return {
    weekLabel: input.weekLabel,
    status,
    worked,
    didntWork,
    blocked,
    deferred,
    nextWeekChanges,
    notes,
    createdAt: input.createdAt,
  };
}

async function loadFollowUpMetrics(missing: string[]): Promise<{ dueNow: number; highIntentQueued: number }> {
  try {
    const rows = await prisma.lead.findMany({
      take: 200,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        message: true,
        createdAt: true,
        aiScore: true,
        aiPriority: true,
        aiTags: true,
        lastContactedAt: true,
        launchSalesContacted: true,
        launchLastContactDate: true,
        pipelineStatus: true,
        aiExplanation: true,
      },
    });
    const q = buildFollowUpQueue(rows.map(leadRowToFollowUpInput));
    const dueNow = q.filter((i) => i.status === "due_now").length;
    const highIntentQueued = q.filter(
      (i) => i.queueScore >= 72 && (i.status === "queued" || i.status === "due_now"),
    ).length;
    return { dueNow, highIntentQueued };
  } catch {
    missing.push("followup_queue_unavailable");
    return { dueNow: 0, highIntentQueued: 0 };
  }
}

async function loadAutopilotCounts(missing: string[]): Promise<{ pending: number; rejected: number; approved: number }> {
  try {
    const p = await listAutopilotActionsWithStatus();
    let pending = 0;
    let rejected = 0;
    let approved = 0;
    for (const a of p.actions) {
      if (a.status === "pending") pending += 1;
      else if (a.status === "rejected") rejected += 1;
      else if (a.status === "approved") approved += 1;
    }
    return { pending, rejected, approved };
  } catch {
    missing.push("autopilot_unavailable");
    return { pending: 0, rejected: 0, approved: 0 };
  }
}

/**
 * Full async build with optional sources gated by their own feature flags (safe partial data).
 * Returns null when `FEATURE_GROWTH_OPERATING_REVIEW_V1` is off.
 */
export async function buildGrowthOperatingReviewSummary(): Promise<GrowthOperatingReviewSummary | null> {
  if (!growthOperatingReviewFlags.growthOperatingReviewV1) {
    return null;
  }

  logGrowthOperatingReviewBuildStarted();
  const missingDataWarnings: string[] = [];
  const now = new Date();
  const createdAt = now.toISOString();
  const weekLabel = formatIsoWeekLabel(now);

  let executive = null;
  try {
    executive = await buildGrowthExecutiveSummary();
  } catch {
    missingDataWarnings.push("executive_unavailable");
  }

  let dailyBrief = null;
  if (growthDailyBriefFlags.growthDailyBriefV1) {
    try {
      dailyBrief = await buildGrowthDailyBrief();
    } catch {
      missingDataWarnings.push("daily_brief_unavailable");
    }
  }

  let strategyBundle = null;
  if (growthStrategyFlags.growthStrategyV1) {
    try {
      strategyBundle = await buildGrowthStrategyBundle();
    } catch {
      missingDataWarnings.push("strategy_unavailable");
    }
  }

  let governance = null;
  if (growthGovernanceFlags.growthGovernanceV1) {
    try {
      governance = await evaluateGrowthGovernance();
    } catch {
      missingDataWarnings.push("governance_unavailable");
    }
  }

  let simulationBundle = null;
  if (growthSimulationFlags.growthSimulationV1) {
    try {
      simulationBundle = await buildGrowthSimulationBundle();
    } catch {
      missingDataWarnings.push("simulation_unavailable");
    }
  }

  let memorySummary = null;
  if (growthMemoryFlags.growthMemoryV1) {
    try {
      memorySummary = await buildGrowthMemorySummary();
    } catch {
      missingDataWarnings.push("memory_unavailable");
    }
  }

  let agentCoordination = null;
  if (growthMultiAgentFlags.growthMultiAgentV1) {
    try {
      agentCoordination = await coordinateGrowthAgents();
    } catch {
      missingDataWarnings.push("agents_unavailable");
    }
  }

  let enforcementSnapshot = null;
  if (growthPolicyEnforcementFlags.growthPolicyEnforcementV1) {
    try {
      enforcementSnapshot = await buildGrowthPolicyEnforcementSnapshot();
    } catch {
      missingDataWarnings.push("enforcement_unavailable");
    }
  }

  let learningControlFreezeRecommended = false;
  if (growthLearningFlags.growthLearningV1) {
    try {
      const { getGrowthLearningReadOnlyForCadence } = await import("./growth-learning.service");
      const lr = await getGrowthLearningReadOnlyForCadence();
      learningControlFreezeRecommended = lr?.learningControl?.state === "freeze_recommended";
    } catch {
      missingDataWarnings.push("learning_control_unavailable");
    }
  }

  const followUp = await loadFollowUpMetrics(missingDataWarnings);
  const autopilot = await loadAutopilotCounts(missingDataWarnings);

  const input: GrowthOperatingReviewBuildInput = {
    weekLabel,
    createdAt,
    executive,
    dailyBrief,
    strategyBundle,
    governance,
    simulationBundle,
    memorySummary,
    agentCoordination,
    enforcementSnapshot,
    journalReflections: [],
    autopilot,
    followUp,
    learningControlFreezeRecommended,
    missingDataWarnings,
  };

  const summary = assembleGrowthOperatingReviewSummary(input);

  recordGrowthOperatingReviewBuild({
    status: summary.status,
    worked: summary.worked.length,
    didntWork: summary.didntWork.length,
    blocked: summary.blocked.length,
    deferred: summary.deferred.length,
    nextWeekChanges: summary.nextWeekChanges.length,
    missingDataWarnings: missingDataWarnings.length,
  });

  return summary;
}
