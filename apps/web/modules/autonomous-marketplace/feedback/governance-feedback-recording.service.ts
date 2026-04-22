/**
 * Records governance prediction vs outcomes — advisory persistence; never blocks callers.
 */
import type { ExecutionResult, GovernanceResolution, ProposedAction } from "../types/domain.types";
import type { SafeExecutionGateOutput } from "../execution/safe-execution-gate.service";
import type { UnifiedGovernanceResult } from "../governance/unified-governance.types";
import { classifyGovernanceOutcome } from "./governance-feedback-classifier.service";
import type {
  GovernanceFeedbackInput,
  GovernanceGroundTruthEvent,
  GovernancePredictionSnapshot,
} from "./governance-feedback.types";
import { persistGovernanceFeedbackRecord } from "./governance-feedback.repository";
import { buildGovernanceTrainingRow } from "./governance-training-data.service";

export function buildGovernancePredictionSnapshot(params: {
  unified: UnifiedGovernanceResult | null;
  mergedGovernance: GovernanceResolution;
  gate: SafeExecutionGateOutput;
}): GovernancePredictionSnapshot {
  const u = params.unified;
  const gateBlocked =
    params.gate.status === "blocked" ||
    params.gate.reasons.some((r) => r === "legal_risk_critical" || r === "unified_governance_block");
  const blocked =
    gateBlocked ||
    u?.blocked === true ||
    u?.disposition === "REJECTED" ||
    u?.disposition === "BLOCKED_FOR_REGION";

  const requiresHumanApproval =
    params.gate.requiresApproval ||
    u?.requiresHumanApproval === true ||
    u?.disposition === "REQUIRE_APPROVAL";

  let allowExecution =
    !blocked &&
    !requiresHumanApproval &&
    Boolean(params.gate.allowed && params.mergedGovernance.allowExecution);
  if (u?.allowExecution === false) allowExecution = false;

  const disposition = u?.disposition ?? String(params.mergedGovernance.disposition ?? "UNKNOWN");

  return {
    governanceDisposition: disposition,
    blocked,
    requiresHumanApproval,
    allowExecution,
    policyDecision: u?.policyDecision,
    legalRiskScore: u?.legalRisk.score ?? 0,
    legalRiskLevel: u?.legalRisk.level ?? "LOW",
    fraudRiskScore: u?.fraudRisk.score ?? 0,
    fraudRiskLevel: u?.fraudRisk.level ?? "LOW",
    combinedRiskScore: u?.combinedRisk.score ?? 0,
    combinedRiskLevel: u?.combinedRisk.level ?? "LOW",
    revenueImpactEstimate: u?.fraudRisk.revenueImpactEstimate,
    trace: u?.trace,
  };
}

export function truthEventsFromExecutionResult(
  execution: ExecutionResult,
  occurredAt?: string,
): GovernanceGroundTruthEvent[] {
  try {
    const ts =
      typeof occurredAt === "string"
        ? occurredAt
        : typeof execution.finishedAt === "string"
          ? execution.finishedAt
          : execution.startedAt;
    const out: GovernanceGroundTruthEvent[] = [];
    if (execution.status === "EXECUTED") {
      out.push({ type: "execution_succeeded", occurredAt: ts });
    }
    if (execution.status === "FAILED") {
      out.push({ type: "execution_failed", occurredAt: ts });
    }
    return out;
  } catch {
    return [];
  }
}

/** Safe fire-and-forget wrapper — logs only on failure. */
export async function recordGovernanceFeedbackSafe(params: {
  input: GovernanceFeedbackInput;
}): Promise<void> {
  try {
    const result = classifyGovernanceOutcome(params.input);
    const trainingRow = buildGovernanceTrainingRow({ input: params.input, result });
    await persistGovernanceFeedbackRecord({
      input: params.input,
      result,
      trainingRow: trainingRow as unknown as Record<string, unknown>,
    });
  } catch (e) {
    console.warn("[governance-feedback] recordGovernanceFeedbackSafe skipped", e);
  }
}

export type RecordControlledExecutionFeedbackParams = {
  ctx: { runId: string; regionCode: string; createdByUserId?: string | null };
  proposed: ProposedAction;
  unified: UnifiedGovernanceResult | null;
  mergedGovernance: GovernanceResolution;
  gate: SafeExecutionGateOutput;
  execution: ExecutionResult;
  extraTruthEvents?: GovernanceGroundTruthEvent[];
};

export async function recordControlledExecutionFeedbackAsync(
  params: RecordControlledExecutionFeedbackParams,
): Promise<void> {
  try {
    const prediction = buildGovernancePredictionSnapshot({
      unified: params.unified,
      mergedGovernance: params.mergedGovernance,
      gate: params.gate,
    });
    const meta =
      params.proposed.metadata && typeof params.proposed.metadata === "object"
        ? (params.proposed.metadata as Record<string, unknown>)
        : {};
    const truth = [
      ...truthEventsFromExecutionResult(params.execution),
      ...(params.extraTruthEvents ?? []),
    ];
    const input: GovernanceFeedbackInput = {
      runId: params.ctx.runId,
      entityType: params.proposed.target?.type,
      entityId: params.proposed.target?.id ?? undefined,
      regionCode: params.ctx.regionCode,
      actionType: params.proposed.type,
      userId: params.ctx.createdByUserId ?? undefined,
      listingId: typeof meta.listingId === "string" ? meta.listingId : undefined,
      prediction,
      truthEvents: truth,
    };
    await recordGovernanceFeedbackSafe({ input });
  } catch (e) {
    console.warn("[governance-feedback] recordControlledExecutionFeedbackAsync skipped", e);
  }
}
