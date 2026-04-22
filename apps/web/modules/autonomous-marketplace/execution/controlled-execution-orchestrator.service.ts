/**
 * Controlled execution orchestrator — single deterministic step per proposed action.
 * Preview / `previewForListing` never invokes this module.
 */
import { engineFlags } from "@/config/feature-flags";
import { autonomyConfig } from "../config/autonomy.config";
import type { ExecutionResult, GovernanceResolution, PolicyDecision, ProposedAction } from "../types/domain.types";
import type { ControlledExecutionDecision } from "./controlled-execution.types";
import { applyControlledAction } from "./action-application.service";
import { dispatchExecution } from "./action-dispatch";
import { requestActionApproval } from "./action-approval.service";
import {
  recordExecutionAttempt,
  recordExecutionDecision,
  recordExecutionOutcome,
} from "./execution-audit.service";
import { verifyActionOutcome } from "./execution-verification.service";
import { rollbackControlledAction } from "./rollback.service";
import { evaluateSafeExecutionGate, type SafeExecutionGateOutput } from "./safe-execution-gate.service";
import { buildComplianceGateSnapshotFromPolicy } from "./compliance-gate-from-policy.service";
import { canRegionExecuteAction } from "./region-safe-execution.service";
import {
  buildUnifiedGovernanceExecutionInput,
  evaluateUnifiedGovernance,
} from "../governance/unified-governance.service";
import { mergeGovernanceWithUnified } from "../governance/unified-governance-merge.service";
import type { UnifiedGovernanceResult } from "../governance/unified-governance.types";
import { evaluateLegalRisk, type LegalRiskResult } from "../legal/legal-risk.service";
import { recordControlledExecutionFeedbackAsync } from "../feedback/governance-feedback-recording.service";

function governanceSnapshots(
  unified: UnifiedGovernanceResult | null,
  legalRiskRun: LegalRiskResult,
): Record<string, unknown> {
  try {
    const clone = <T>(v: T): T => JSON.parse(JSON.stringify(v)) as T;
    const base: Record<string, unknown> = {
      legalRiskJson: clone(legalRiskRun),
    };
    if (unified) {
      Object.assign(base, {
        unifiedGovernanceJson: clone(unified),
        combinedRiskJson: clone(unified.combinedRisk),
        fraudRiskJson: clone(unified.fraudRisk),
        traceJson: clone(unified.trace),
      });
    }
    return base;
  } catch {
    return {
      legalRiskJson: legalRiskRun,
      unifiedGovernanceSnapshotFailed: true,
    };
  }
}

function attachUnifiedMetadata(
  execution: ExecutionResult,
  unified: UnifiedGovernanceResult | null,
  legalRiskRun: LegalRiskResult,
): ExecutionResult {
  return {
    ...execution,
    metadata: {
      ...execution.metadata,
      ...governanceSnapshots(unified, legalRiskRun),
    },
  };
}

function collectLegalRiskSignals(
  ctx: ControlledExecutionOrchestratorContext,
  proposed: ProposedAction,
): string[] {
  const out = new Set<string>(ctx.signals ?? []);
  const meta =
    proposed.metadata && typeof proposed.metadata === "object"
      ? (proposed.metadata as Record<string, unknown>)
      : {};
  if (meta.fraudFlag === true) out.add("fraud_flag");
  if (meta.payoutAnomaly === true) out.add("payout_anomaly");
  if (meta.lowBookingActivity === true) out.add("low_booking_activity");
  const extra = meta.legalRiskSignals;
  if (Array.isArray(extra)) {
    for (const x of extra) {
      if (typeof x === "string") out.add(x);
    }
  }
  return [...out];
}

export type ControlledExecutionOrchestratorContext = {
  runId: string;
  dryRun: boolean;
  createdByUserId?: string | null;
  /** Platform region code for the observation target. */
  regionCode: string;
  /** Syria / external source hints for capability resolution. */
  listingSource?: string;
  /** Deterministic legal-risk signal codes (merged with metadata-derived signals). */
  signals?: string[];
};

export type OrchestratedControlledActionInput = {
  proposed: ProposedAction;
  policy: PolicyDecision;
  governance: GovernanceResolution;
};

function gateStatusToDecisionStatus(gate: SafeExecutionGateOutput): ControlledExecutionDecision["status"] {
  if (gate.status === "pending_approval") return "pending_approval";
  if (gate.status === "blocked") return "blocked";
  if (gate.status === "dry_run") return "dry_run";
  if (gate.status === "skipped") return "skipped";
  return "not_started";
}

function buildDecision(params: {
  proposed: ProposedAction;
  gate: SafeExecutionGateOutput;
  regionCode: string;
  listingSource?: string;
}): ControlledExecutionDecision {
  return {
    actionId: params.proposed.id,
    actionType: params.proposed.type,
    status: gateStatusToDecisionStatus(params.gate),
    reasons: [...params.gate.reasons],
    allowExecution: params.gate.allowed,
    requiresApproval: params.gate.requiresApproval,
    regionCode: params.regionCode,
    source: params.listingSource,
  };
}

export type RunControlledExecutionParams = {
  ctx: ControlledExecutionOrchestratorContext;
  input: OrchestratedControlledActionInput;
};

/**
 * Single-action controlled run — spec entry name wrapping {@link runControlledExecutionStep}.
 * Preview pipelines must not call this path.
 */
export async function runControlledExecution(
  params: RunControlledExecutionParams,
): Promise<{
  execution: ExecutionResult;
  gate: SafeExecutionGateOutput;
  decision: ControlledExecutionDecision;
}> {
  return runControlledExecutionStep(params.ctx, params.input);
}

/**
 * Runs gates + optional apply for one action. Never throws — failures surface as ExecutionResult metadata.
 */
export async function runControlledExecutionStep(
  ctx: ControlledExecutionOrchestratorContext,
  input: OrchestratedControlledActionInput,
): Promise<{
  execution: ExecutionResult;
  gate: SafeExecutionGateOutput;
  decision: ControlledExecutionDecision;
}> {
  const { proposed, policy, governance } = input;
  let unifiedGovernance: UnifiedGovernanceResult | null = null;
  try {
    unifiedGovernance = await evaluateUnifiedGovernance(
      buildUnifiedGovernanceExecutionInput({
        ctx: {
          dryRun: ctx.dryRun,
          regionCode: ctx.regionCode,
          listingSource: ctx.listingSource,
        },
        proposed,
        policy,
      }),
    );
  } catch {
    unifiedGovernance = null;
  }

  const mergedGovernance = unifiedGovernance
    ? mergeGovernanceWithUnified(governance, unifiedGovernance)
    : governance;

  const compliance = buildComplianceGateSnapshotFromPolicy(policy);
  const regionSafe = canRegionExecuteAction({
    regionCode: ctx.regionCode,
    source: ctx.listingSource,
    actionType: proposed.type,
  });

  let gate = evaluateSafeExecutionGate({
    policy,
    governance: mergedGovernance,
    compliance,
    legalRisk: { score: unifiedGovernance?.legalRisk.score ?? 0 },
    trust: { tags: [] },
    runDryRun: ctx.dryRun,
    actionTypeEnabledInConfig: autonomyConfig.actionExecutionAllowed[proposed.type] === true,
    regionExecutionProfile: regionSafe.profile,
  });

  if (
    unifiedGovernance &&
    (unifiedGovernance.blocked ||
      unifiedGovernance.disposition === "REJECTED" ||
      unifiedGovernance.disposition === "BLOCKED_FOR_REGION")
  ) {
    gate = {
      allowed: false,
      status: "blocked",
      reasons: [...gate.reasons, "unified_governance_block"],
      requiresApproval: false,
    };
  }

  const decision = buildDecision({
    proposed,
    gate,
    regionCode: ctx.regionCode,
    listingSource: ctx.listingSource,
  });

  const now = () => new Date().toISOString();

  await recordExecutionAttempt({
    runId: ctx.runId,
    actionId: proposed.id,
    actionType: proposed.type,
    actorUserId: ctx.createdByUserId ?? null,
  });

  await recordExecutionDecision({
    runId: ctx.runId,
    actionId: proposed.id,
    dispositionSummary: `${policy.disposition}/${mergedGovernance.disposition}`,
    gateAllowed: gate.allowed,
    actorUserId: ctx.createdByUserId ?? null,
  });

  let execution: ExecutionResult;

  if (gate.requiresApproval && engineFlags.autonomyApprovalsV1) {
    const appr = await requestActionApproval({
      runId: ctx.runId,
      proposed,
      policy,
      governance: mergedGovernance,
      requestedByUserId: ctx.createdByUserId ?? null,
    });
    const ts = now();
    if (appr.ok) {
      execution = attachUnifiedMetadata(
        {
          status: "REQUIRES_APPROVAL",
          startedAt: ts,
          finishedAt: ts,
          detail: "Pending human approval",
          metadata: {
            approvalRequestId: appr.id,
          },
        },
        unifiedGovernance,
        legalRiskRun,
      );
    } else {
      execution = await dispatchExecution(proposed, { dryRun: true, allowExecute: false });
      execution = attachUnifiedMetadata(
        {
          ...execution,
          metadata: {
            ...execution.metadata,
            approvalEnqueueFailed: appr.error,
          },
        },
        unifiedGovernance,
        legalRiskRun,
      );
    }
  } else if (gate.requiresApproval && !engineFlags.autonomyApprovalsV1) {
    execution = attachUnifiedMetadata(
      await dispatchExecution(proposed, { dryRun: true, allowExecute: false }),
      unifiedGovernance,
      legalRiskRun,
    );
  } else if (gate.allowed) {
    const app = await applyControlledAction({ proposed, gate });
    execution = attachUnifiedMetadata(
      app.executionResult ??
        ({
          status: "FAILED",
          startedAt: now(),
          finishedAt: now(),
          detail: app.errorMessage ?? "applyControlledAction returned no execution",
          metadata: {},
        } satisfies ExecutionResult),
      unifiedGovernance,
      legalRiskRun,
    );

    const verifyEnabled =
      (engineFlags.autonomyExecutionVerifyV1 === true || engineFlags.autopilotHardeningV1 === true) &&
      engineFlags.controlledExecutionV1 === true;

    if (verifyEnabled && app.executionResult && app.executionResult.status === "EXECUTED") {
      const v = verifyActionOutcome({
        proposed,
        execution: app.executionResult,
        executionContext:
          unifiedGovernance != null
            ? {
                actionType: proposed.type,
                regionCode: ctx.regionCode,
                governance: {
                  disposition: unifiedGovernance.disposition,
                  blocked: unifiedGovernance.blocked,
                  requiresHumanApproval: unifiedGovernance.requiresHumanApproval,
                  allowExecution: unifiedGovernance.allowExecution,
                  policyDecision: unifiedGovernance.policyDecision,
                  legalRisk: unifiedGovernance.legalRisk,
                  fraudRisk: unifiedGovernance.fraudRisk,
                  combinedRisk: unifiedGovernance.combinedRisk,
                  trace: unifiedGovernance.trace,
                },
              }
            : undefined,
      });
      const rollbackEnabled =
        engineFlags.autonomyRollbackV1 === true || engineFlags.autopilotHardeningV1 === true;

      if (rollbackEnabled && !v.verified && v.reversible) {
        await rollbackControlledAction({
          runId: ctx.runId,
          proposed,
          execution: app.executionResult,
          actorUserId: ctx.createdByUserId ?? null,
        });
      }
    }
  } else {
    execution = attachUnifiedMetadata(
      await dispatchExecution(proposed, { dryRun: true, allowExecute: false }),
      unifiedGovernance,
      legalRiskRun,
    );
  }

  await recordExecutionOutcome({
    runId: ctx.runId,
    actionId: proposed.id,
    executionStatus: execution.status,
    actorUserId: ctx.createdByUserId ?? null,
  });

  void recordControlledExecutionFeedbackAsync({
    ctx: { runId: ctx.runId, regionCode: ctx.regionCode, createdByUserId: ctx.createdByUserId },
    proposed,
    unified: unifiedGovernance,
    mergedGovernance,
    gate,
    execution,
  });

  return { execution, gate, decision };
}

export type ControlledExecutionBatchParams = {
  ctx: ControlledExecutionOrchestratorContext;
  actions: OrchestratedControlledActionInput[];
};

/** Deterministic ordering — caller supplies sorted actions. */
export async function runControlledExecutionBatch(params: ControlledExecutionBatchParams): Promise<{
  results: Array<{ execution: ExecutionResult; gate: SafeExecutionGateOutput; decision: ControlledExecutionDecision }>;
}> {
  const results: Array<{
    execution: ExecutionResult;
    gate: SafeExecutionGateOutput;
    decision: ControlledExecutionDecision;
  }> = [];

  for (const a of params.actions) {
    const r = await runControlledExecutionStep(params.ctx, a);
    results.push(r);
  }

  return { results };
}
