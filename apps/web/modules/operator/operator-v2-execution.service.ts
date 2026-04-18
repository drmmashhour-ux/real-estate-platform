/**
 * Operator V2 — approved budget sync orchestration: guardrails → simulate → optional outbound sync.
 * Does not auto-approve; external writes require flags + credentials (adapters refuse fabricated success).
 */
import { isPlatformCoreAuditEffective, operatorV2Flags } from "@/config/feature-flags";
import { PLATFORM_CORE_AUDIT } from "@/modules/platform-core/platform-core.constants";
import { recordAudit } from "@/modules/platform-core/platform-core.service";
import { evaluateBudgetGuardrails } from "./operator-budget-guardrails.service";
import { buildBudgetSyncPayloadFromRecommendation } from "./operator-budget-prep.service";
import { isExternallySyncableBudgetAction } from "./operator-execution.types";
import * as operatorRepo from "./operator.repository";
import * as syncRepo from "./operator-external-sync.repository";
import type { BudgetGuardrailResult, BudgetSyncPayload, ExternalSyncResult } from "./operator-v2.types";
import { getBudgetAdapter } from "./provider-sync/provider-adapter.registry";
import { brainDecisionFromAssistantRecommendation } from "./operator-one-brain.guard";

function runtimeEnv(): "development" | "staging" | "production" {
  if (process.env.VERCEL_ENV === "production" || process.env.NODE_ENV === "production") return "production";
  if (process.env.VERCEL_ENV === "preview") return "staging";
  return "development";
}

async function latestApprovalStatus(recommendationId: string): Promise<string> {
  const rows = await operatorRepo.listApprovalsForRecommendation(recommendationId);
  const latest = rows[0];
  return latest?.status ?? "PENDING";
}

async function hasConflictForCampaign(campaignId: string): Promise<boolean> {
  const snaps = await operatorRepo.listRecentConflicts(120);
  return snaps.some((s) => s.targetId === campaignId);
}

function metricsNum(m: Record<string, unknown> | undefined, key: string): number | null {
  if (!m) return null;
  const v = m[key];
  if (typeof v === "number" && Number.isFinite(v)) return v;
  return null;
}

function profitabilityFromMetrics(m: Record<string, unknown> | undefined): string | null {
  if (!m) return null;
  const v = m.profitabilityStatus ?? m.profitStatus;
  return typeof v === "string" ? v : null;
}

function applyGuardrailCap(payload: BudgetSyncPayload, guard: BudgetGuardrailResult): BudgetSyncPayload {
  if (guard.cappedBudget == null) return payload;
  return { ...payload, proposedBudget: guard.cappedBudget };
}

export type OperatorV2BudgetSyncOutcome = {
  recommendationId: string;
  campaignId: string;
  phase: "blocked" | "simulated" | "executed" | "failed" | "disabled";
  guardrails: BudgetGuardrailResult;
  simulation?: ExternalSyncResult;
  execution?: ExternalSyncResult;
  message: string;
};

async function auditV2(
  eventType: (typeof PLATFORM_CORE_AUDIT)[keyof typeof PLATFORM_CORE_AUDIT],
  message: string,
  entityId: string | null,
  metadata?: Record<string, unknown>,
) {
  if (!isPlatformCoreAuditEffective()) return;
  await recordAudit({
    eventType,
    source: "OPERATOR",
    entityType: "CAMPAIGN",
    entityId,
    message,
    metadata,
  });
}

/**
 * Dry-run / simulation — approval not required; guardrails use `simulateOnly` (approval check skipped).
 */
export async function simulateApprovedBudgetSync(recommendationId: string): Promise<OperatorV2BudgetSyncOutcome> {
  if (!operatorV2Flags.operatorV2BudgetSyncV1) {
    return {
      recommendationId,
      campaignId: "",
      phase: "disabled",
      guardrails: {
        allowed: false,
        blockingReasons: ["Operator V2 budget sync is disabled (FEATURE_OPERATOR_V2_BUDGET_SYNC_V1)."],
        warnings: [],
      },
      message: "Operator V2 budget sync flag is off.",
    };
  }

  const rec = await operatorRepo.getRecommendationById(recommendationId);
  if (!rec || !isExternallySyncableBudgetAction(rec.actionType)) {
    return {
      recommendationId,
      campaignId: "",
      phase: "failed",
      guardrails: {
        allowed: false,
        blockingReasons: ["Recommendation not found or not eligible for external budget sync."],
        warnings: [],
      },
      message: "Invalid recommendation for V2 budget sync.",
    };
  }

  const prep = await buildBudgetSyncPayloadFromRecommendation(rec);
  if (!prep.ok) {
    await auditV2(
      PLATFORM_CORE_AUDIT.OPERATOR_V2_BUDGET_SYNC_BLOCKED,
      `Simulation prep blocked: ${prep.blockingReasons.join("; ")}`,
      null,
      { recommendationId, blockingReasons: prep.blockingReasons },
    );
    return {
      recommendationId,
      campaignId: "",
      phase: "blocked",
      guardrails: { allowed: false, blockingReasons: prep.blockingReasons, warnings: prep.warnings ?? [] },
      message: prep.blockingReasons.join(" "),
    };
  }

  const approvalStatus = await latestApprovalStatus(recommendationId);
  const env = runtimeEnv();
  const conflict = await hasConflictForCampaign(prep.payload.campaignId);
  const m = rec.metrics;

  const guard = evaluateBudgetGuardrails({
    currentBudget: prep.payload.currentBudget,
    proposedBudget: prep.payload.proposedBudget,
    confidenceScore: rec.confidenceScore,
    approvalStatus,
    hasConflicts: conflict,
    cpl: metricsNum(m, "cpl"),
    ltv: metricsNum(m, "ltv"),
    profitabilityStatus: profitabilityFromMetrics(m),
    evidenceScore: rec.evidenceScore ?? 0,
    environment: env,
    simulateOnly: true,
  });

  const payload = applyGuardrailCap(prep.payload, guard);

  if (!guard.allowed) {
    await syncRepo.saveBudgetExecutionSnapshot({
      campaignId: payload.campaignId,
      provider: payload.provider,
      currentBudget: payload.currentBudget,
      proposedBudget: payload.proposedBudget,
      cappedBudget: guard.cappedBudget ?? null,
      currency: payload.currency,
      confidenceScore: rec.confidenceScore,
      profitStatus: profitabilityFromMetrics(m),
      approvalStatus,
      executionMode: "SIMULATION_ONLY",
      metadata: { recommendationId, guardrails: guard, phase: "simulation_blocked" },
    });
    await syncRepo.logExternalSync({
      recommendationId,
      actionType: prep.executionAction,
      provider: payload.provider,
      targetId: payload.campaignId,
      externalTargetId: payload.externalCampaignId ?? null,
      dryRun: true,
      success: false,
      message: `Simulation blocked by guardrails: ${guard.blockingReasons.join("; ")}`,
      requestPayload: { payload, previousBudget: prep.payload.currentBudget },
      responsePayload: { guardrails: guard },
      warnings: [...guard.blockingReasons, ...guard.warnings],
    });
    await auditV2(
      PLATFORM_CORE_AUDIT.OPERATOR_V2_BUDGET_SYNC_BLOCKED,
      `V2 simulation blocked: ${guard.blockingReasons.join("; ")}`,
      payload.campaignId,
      { recommendationId, guardrails: guard, dryRun: true },
    );
    return {
      recommendationId,
      campaignId: payload.campaignId,
      phase: "blocked",
      guardrails: guard,
      message: guard.blockingReasons.join(" "),
    };
  }

  const adapter = getBudgetAdapter(payload.provider);
  const simulation = await adapter.simulateBudgetChange({ ...payload, executionAction: prep.executionAction });

  await syncRepo.saveBudgetExecutionSnapshot({
    campaignId: payload.campaignId,
    provider: payload.provider,
    currentBudget: prep.payload.currentBudget,
    proposedBudget: payload.proposedBudget,
    cappedBudget: guard.cappedBudget ?? null,
    currency: payload.currency,
    confidenceScore: rec.confidenceScore,
    profitStatus: profitabilityFromMetrics(m),
    approvalStatus,
    executionMode: "DRY_RUN",
    metadata: { recommendationId, simulation: syncRepo.externalSyncResultToLogPayload(simulation) },
  });

  await syncRepo.logExternalSync({
    recommendationId,
    actionType: prep.executionAction,
    provider: payload.provider,
    targetId: payload.campaignId,
    externalTargetId: payload.externalCampaignId ?? null,
    dryRun: true,
    success: simulation.success,
    message: simulation.message,
    requestPayload: { payload: { ...payload, executionAction: prep.executionAction }, previousBudget: prep.payload.currentBudget },
    responsePayload: syncRepo.externalSyncResultToLogPayload(simulation),
    warnings: simulation.warnings,
  });

  await auditV2(
    PLATFORM_CORE_AUDIT.OPERATOR_V2_BUDGET_SYNC_SIMULATED,
    `V2 budget sync simulated (dry-run): ${simulation.message}`,
    payload.campaignId,
    {
      recommendationId,
      provider: payload.provider,
      dryRun: true,
      simulation: syncRepo.externalSyncResultToLogPayload(simulation),
    },
  );

  return {
    recommendationId,
    campaignId: payload.campaignId,
    phase: "simulated",
    guardrails: guard,
    simulation,
    message: simulation.message,
  };
}

/**
 * Executes outbound sync after guardrails + successful simulation. Requires APPROVED recommendation.
 */
export async function executeApprovedBudgetSync(recommendationId: string): Promise<OperatorV2BudgetSyncOutcome> {
  if (!operatorV2Flags.operatorV2BudgetSyncV1) {
    return {
      recommendationId,
      campaignId: "",
      phase: "disabled",
      guardrails: {
        allowed: false,
        blockingReasons: ["Operator V2 budget sync is disabled (FEATURE_OPERATOR_V2_BUDGET_SYNC_V1)."],
        warnings: [],
      },
      message: "Operator V2 budget sync flag is off.",
    };
  }

  const rec = await operatorRepo.getRecommendationById(recommendationId);
  if (!rec || !isExternallySyncableBudgetAction(rec.actionType)) {
    return {
      recommendationId,
      campaignId: "",
      phase: "failed",
      guardrails: {
        allowed: false,
        blockingReasons: ["Recommendation not found or not eligible for external budget sync."],
        warnings: [],
      },
      message: "Invalid recommendation for V2 budget sync.",
    };
  }

  const approvalStatus = await latestApprovalStatus(recommendationId);
  if (approvalStatus !== "APPROVED") {
    await auditV2(
      PLATFORM_CORE_AUDIT.OPERATOR_V2_BUDGET_SYNC_BLOCKED,
      "Execute blocked: recommendation is not approved.",
      rec.targetId ?? null,
      { recommendationId, approvalStatus },
    );
    return {
      recommendationId,
      campaignId: rec.targetId ?? "",
      phase: "blocked",
      guardrails: {
        allowed: false,
        blockingReasons: ["Recommendation is not approved."],
        warnings: [],
      },
      message: "Execution requires an approved recommendation.",
    };
  }

  const brain = brainDecisionFromAssistantRecommendation(rec);
  if (!brain.executionAllowed) {
    await auditV2(
      PLATFORM_CORE_AUDIT.OPERATOR_V2_BUDGET_SYNC_BLOCKED,
      "Execute blocked: One Brain policy (trust too low, blockers, or insufficient evidence).",
      rec.targetId ?? null,
      { recommendationId, oneBrain: brain },
    );
    return {
      recommendationId,
      campaignId: rec.targetId ?? "",
      phase: "blocked",
      guardrails: {
        allowed: false,
        blockingReasons: [
          "One Brain: execution not allowed — use dry-run simulation only until trust and evidence thresholds are met.",
        ],
        warnings: [brain.reasoning],
      },
      message: brain.reasoning,
    };
  }

  const prep = await buildBudgetSyncPayloadFromRecommendation(rec);
  if (!prep.ok) {
    await auditV2(
      PLATFORM_CORE_AUDIT.OPERATOR_V2_BUDGET_SYNC_BLOCKED,
      `Execute prep blocked: ${prep.blockingReasons.join("; ")}`,
      null,
      { recommendationId, blockingReasons: prep.blockingReasons },
    );
    return {
      recommendationId,
      campaignId: "",
      phase: "blocked",
      guardrails: { allowed: false, blockingReasons: prep.blockingReasons, warnings: prep.warnings ?? [] },
      message: prep.blockingReasons.join(" "),
    };
  }

  const env = runtimeEnv();
  const conflict = await hasConflictForCampaign(prep.payload.campaignId);
  const m = rec.metrics;

  const guard = evaluateBudgetGuardrails({
    currentBudget: prep.payload.currentBudget,
    proposedBudget: prep.payload.proposedBudget,
    confidenceScore: rec.confidenceScore,
    approvalStatus: "APPROVED",
    hasConflicts: conflict,
    cpl: metricsNum(m, "cpl"),
    ltv: metricsNum(m, "ltv"),
    profitabilityStatus: profitabilityFromMetrics(m),
    evidenceScore: rec.evidenceScore ?? rec.confidenceScore,
    environment: env,
  });

  const payload = applyGuardrailCap(prep.payload, guard);

  if (!guard.allowed) {
    await syncRepo.logExternalSync({
      recommendationId,
      actionType: prep.executionAction,
      provider: payload.provider,
      targetId: payload.campaignId,
      externalTargetId: payload.externalCampaignId ?? null,
      dryRun: false,
      success: false,
      message: `Execute blocked by guardrails: ${guard.blockingReasons.join("; ")}`,
      requestPayload: { payload, previousBudget: prep.payload.currentBudget },
      responsePayload: { guardrails: guard },
      warnings: [...guard.blockingReasons, ...guard.warnings],
    });
    await auditV2(
      PLATFORM_CORE_AUDIT.OPERATOR_V2_BUDGET_SYNC_BLOCKED,
      `V2 execute blocked: ${guard.blockingReasons.join("; ")}`,
      payload.campaignId,
      { recommendationId, guardrails: guard },
    );
    return {
      recommendationId,
      campaignId: payload.campaignId,
      phase: "blocked",
      guardrails: guard,
      message: guard.blockingReasons.join(" "),
    };
  }

  const adapter = getBudgetAdapter(payload.provider);
  const simulation = await adapter.simulateBudgetChange({ ...payload, executionAction: prep.executionAction });

  await syncRepo.logExternalSync({
    recommendationId,
    actionType: prep.executionAction,
    provider: payload.provider,
    targetId: payload.campaignId,
    externalTargetId: payload.externalCampaignId ?? null,
    dryRun: true,
    success: simulation.success,
    message: `[pre-exec sim] ${simulation.message}`,
    requestPayload: { payload: { ...payload, executionAction: prep.executionAction }, previousBudget: prep.payload.currentBudget },
    responsePayload: syncRepo.externalSyncResultToLogPayload(simulation),
    warnings: simulation.warnings,
  });

  if (!simulation.success) {
    await auditV2(
      PLATFORM_CORE_AUDIT.OPERATOR_V2_BUDGET_SYNC_FAILED,
      `V2 execute aborted: simulation failed — ${simulation.message}`,
      payload.campaignId,
      { recommendationId, simulation: syncRepo.externalSyncResultToLogPayload(simulation) },
    );
    return {
      recommendationId,
      campaignId: payload.campaignId,
      phase: "failed",
      guardrails: guard,
      simulation,
      message: "Simulation failed — outbound sync not attempted.",
    };
  }

  const execution = await adapter.syncBudgetChange({ ...payload, executionAction: prep.executionAction });

  await syncRepo.saveBudgetExecutionSnapshot({
    campaignId: payload.campaignId,
    provider: payload.provider,
    currentBudget: prep.payload.currentBudget,
    proposedBudget: payload.proposedBudget,
    cappedBudget: guard.cappedBudget ?? null,
    currency: payload.currency,
    confidenceScore: rec.confidenceScore,
    profitStatus: profitabilityFromMetrics(m),
    approvalStatus: "APPROVED",
    executionMode: "APPROVED_SYNC",
    metadata: {
      recommendationId,
      execution: syncRepo.externalSyncResultToLogPayload(execution),
      simulation: syncRepo.externalSyncResultToLogPayload(simulation),
    },
  });

  await syncRepo.logExternalSync({
    recommendationId,
    actionType: prep.executionAction,
    provider: payload.provider,
    targetId: payload.campaignId,
    externalTargetId: payload.externalCampaignId ?? null,
    dryRun: false,
    success: execution.success,
    message: execution.message,
    requestPayload: { payload: { ...payload, executionAction: prep.executionAction }, previousBudget: prep.payload.currentBudget },
    responsePayload: syncRepo.externalSyncResultToLogPayload(execution),
    warnings: execution.warnings,
  });

  if (execution.success) {
    await auditV2(
      PLATFORM_CORE_AUDIT.OPERATOR_V2_BUDGET_SYNC_EXECUTED,
      `V2 budget sync executed: ${execution.message}`,
      payload.campaignId,
      { recommendationId, execution: syncRepo.externalSyncResultToLogPayload(execution) },
    );
  } else {
    await auditV2(
      PLATFORM_CORE_AUDIT.OPERATOR_V2_BUDGET_SYNC_FAILED,
      `V2 budget sync execution did not succeed: ${execution.message}`,
      payload.campaignId,
      { recommendationId, execution: syncRepo.externalSyncResultToLogPayload(execution) },
    );
  }

  return {
    recommendationId,
    campaignId: payload.campaignId,
    phase: execution.success ? "executed" : "failed",
    guardrails: guard,
    simulation,
    execution,
    message: execution.message,
  };
}

export async function listExternalExecutionHistory(limit = 50) {
  return syncRepo.listRecentExternalSyncLogs(limit);
}

/** @internal — tests */
export const __test__ = {
  runtimeEnv,
  applyGuardrailCap,
};
