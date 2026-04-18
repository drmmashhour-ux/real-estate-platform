/**
 * Orchestrates one growth learning cycle — read-only metrics, local weight updates only when allowed.
 */

import { prisma } from "@/lib/db";
import { growthGovernanceFlags, growthLearningFlags, growthPolicyEnforcementFlags } from "@/config/feature-flags";
import { computePaidFunnelAdsInsights, fetchEarlyConversionAdsSnapshot } from "./growth-ai-analyzer.service";
import { buildFollowUpQueue, leadRowToFollowUpInput } from "./ai-autopilot-followup.service";
import { linkGrowthSignalsToOutcomes, type GrowthLearningMetricSnapshot } from "./growth-learning-linker.service";
import { evaluateGrowthLearning } from "./growth-learning-evaluator.service";
import {
  applyGrowthWeightAdjustments,
  computeGrowthWeightAdjustments,
  getGrowthCurrentWeights,
} from "./growth-learning-weights.service";
import { GROWTH_LEARNING_MIN_OUTCOMES_FOR_ADJUSTMENT } from "./growth-learning.constants";
import { getAutopilotMonitoringSnapshot } from "./ai-autopilot-execution-monitoring.service";
import { evaluateGrowthGovernance } from "./growth-governance.service";
import { computeGrowthLearningControlDecision } from "./growth-governance-learning.service";
import { recordGrowthLearningControlEvaluation } from "./growth-governance-learning-monitoring.service";
import { logGrowthLearningPhase, recordGrowthLearningRun } from "./growth-learning-monitoring.service";
import type { GrowthLearningCycleResult, GrowthLearningSummary } from "./growth-learning.types";
import type { GrowthLearningControlDecision } from "./growth-governance-learning.types";

export type { GrowthLearningCycleResult } from "./growth-learning.types";

let runCounter = 0;

async function buildGrowthLearningMetricSnapshot(): Promise<GrowthLearningMetricSnapshot> {
  const observedAt = new Date().toISOString();
  let early: Awaited<ReturnType<typeof fetchEarlyConversionAdsSnapshot>> | null = null;
  try {
    early = await fetchEarlyConversionAdsSnapshot();
  } catch {
    early = null;
  }

  let dueNowCount = 0;
  let hotLeadCount = 0;
  let crmLeadTotal = 0;
  try {
    crmLeadTotal = await prisma.lead.count();
    hotLeadCount = await prisma.lead.count({
      where: {
        OR: [{ aiTier: "hot" }, { score: { gte: 75 } }],
      },
    });
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
    dueNowCount = q.filter((i) => i.status === "due_now").length;
  } catch {
    dueNowCount = 0;
    hotLeadCount = 0;
    crmLeadTotal = 0;
  }

  const attributedCampaigns = early?.campaignCounts.filter((c) => c.label !== "(no UTM)").length ?? 0;
  const adsHealth = early ? computePaidFunnelAdsInsights(early).health : "WEAK";

  return {
    observedAt,
    leadsTodayEarly: early?.leadsToday ?? 0,
    totalEarlyLeads: early?.totalLeads ?? 0,
    adsHealth,
    dueNowCount,
    hotLeadCount,
    attributedCampaigns,
    crmLeadTotal,
  };
}

/**
 * Read-only learning + control snapshot for cadence / advisory consumers.
 * Does not apply weight adjustments, increment run counters, or record learning monitoring events.
 */
export async function getGrowthLearningReadOnlyForCadence(): Promise<{
  summary: GrowthLearningSummary;
  learningControl: GrowthLearningControlDecision;
} | null> {
  if (!growthLearningFlags.growthLearningV1) {
    return null;
  }
  try {
    const metrics = await buildGrowthLearningMetricSnapshot();
    const { outcomes } = linkGrowthSignalsToOutcomes(metrics);
    const baseSummary = evaluateGrowthLearning({ outcomes, runIndex: 0 });
    const current = getGrowthCurrentWeights();
    let governanceDecision: Awaited<ReturnType<typeof evaluateGrowthGovernance>> | null = null;
    if (growthGovernanceFlags.growthGovernanceV1) {
      try {
        governanceDecision = await evaluateGrowthGovernance();
      } catch {
        governanceDecision = null;
      }
    }
    const insufficientDataCount = outcomes.filter((o) => o.outcomeType === "insufficient_data").length;
    let executionFailedCount = 0;
    try {
      executionFailedCount = getAutopilotMonitoringSnapshot().failedCount;
    } catch {
      executionFailedCount = 0;
    }
    const learningControl = computeGrowthLearningControlDecision({
      summary: baseSummary,
      insufficientDataCount,
      totalOutcomes: Math.max(1, outcomes.length),
      weights: current,
      governanceDecision,
      executionFailedCount,
    });
    return { summary: baseSummary, learningControl };
  } catch {
    return null;
  }
}

/**
 * Best-effort learning cycle. Returns null when FEATURE_GROWTH_LEARNING_V1 is off.
 */
export async function runGrowthLearningCycle(): Promise<GrowthLearningCycleResult | null> {
  if (!growthLearningFlags.growthLearningV1) {
    return null;
  }

  runCounter += 1;
  logGrowthLearningPhase("started", { run: runCounter });

  const metrics = await buildGrowthLearningMetricSnapshot();
  const { signals, outcomes } = linkGrowthSignalsToOutcomes(metrics);
  const baseSummary = evaluateGrowthLearning({ outcomes, runIndex: runCounter });
  const current = getGrowthCurrentWeights();
  const deltas = computeGrowthWeightAdjustments(baseSummary, current);
  const adjustmentsComputed = Object.keys(deltas).length;

  let governanceDecision: Awaited<ReturnType<typeof evaluateGrowthGovernance>> | null = null;
  if (growthGovernanceFlags.growthGovernanceV1) {
    try {
      governanceDecision = await evaluateGrowthGovernance();
    } catch {
      governanceDecision = null;
    }
  }

  const insufficientDataCount = outcomes.filter((o) => o.outcomeType === "insufficient_data").length;
  let executionFailedCount = 0;
  try {
    executionFailedCount = getAutopilotMonitoringSnapshot().failedCount;
  } catch {
    executionFailedCount = 0;
  }

  const learningControl = computeGrowthLearningControlDecision({
    summary: baseSummary,
    insufficientDataCount,
    totalOutcomes: outcomes.length,
    weights: current,
    governanceDecision,
    executionFailedCount,
  });
  recordGrowthLearningControlEvaluation(learningControl);

  let weightAdjustmentsApplied: string[] = [];
  let blockedAdjustmentCount = 0;

  const canAdaptBase =
    growthLearningFlags.growthLearningAdaptiveWeightsV1 &&
    baseSummary.outcomesLinked >= GROWTH_LEARNING_MIN_OUTCOMES_FOR_ADJUSTMENT &&
    !baseSummary.warnings.some((w) => w.includes("low_evidence"));

  const controlAllowsAdaptation =
    learningControl.state !== "freeze_recommended" && learningControl.state !== "reset_recommended";

  let enforcementAllowsAdaptation = true;
  if (growthPolicyEnforcementFlags.growthPolicyEnforcementV1) {
    try {
      const enf = await buildGrowthPolicyEnforcementSnapshot();
      enforcementAllowsAdaptation = applyPolicyToLearning(enf).allowWeightAdjustments;
    } catch {
      enforcementAllowsAdaptation = true;
    }
  }

  const canAdapt = canAdaptBase && controlAllowsAdaptation && enforcementAllowsAdaptation;

  if (canAdapt && adjustmentsComputed > 0) {
    weightAdjustmentsApplied = applyGrowthWeightAdjustments(deltas);
  } else if (adjustmentsComputed > 0) {
    blockedAdjustmentCount = 1;
  }

  const controlWarnings: string[] = [];
  if (learningControl.state === "monitor") {
    controlWarnings.push(
      `learning_control:monitor — supervision recommended (confidence ${learningControl.confidence.toFixed(2)})`,
    );
  }
  if (learningControl.state === "freeze_recommended" || learningControl.state === "reset_recommended") {
    controlWarnings.push(
      `learning_control:${learningControl.state} — adaptive weight updates skipped this cycle (advisory gate)`,
    );
  }

  const summary: GrowthLearningSummary = {
    ...baseSummary,
    warnings: [...baseSummary.warnings, ...controlWarnings],
    adjustmentsApplied: [...baseSummary.adjustmentsApplied, ...weightAdjustmentsApplied.map((s) => `applied:${s}`)],
  };

  const weights = getGrowthCurrentWeights();

  recordGrowthLearningRun({
    outcomesLinked: outcomes.length,
    insufficientDataCount,
    adjustmentsComputed,
    adjustmentsApplied: weightAdjustmentsApplied.length,
    blockedAdjustmentCount,
    weights,
    warningsCount: summary.warnings.length,
  });

  return {
    summary,
    weights,
    signals,
    weightAdjustmentsApplied,
    adaptiveWeightsEnabled: growthLearningFlags.growthLearningAdaptiveWeightsV1,
    monitoringEnabled: growthLearningFlags.growthLearningMonitoringV1,
    learningControl,
  };
}

export function resetGrowthLearningRunCounterForTests(): void {
  runCounter = 0;
}
