import type { GovernancePredictionSnapshot } from "../feedback/governance-feedback.types";
import { classifyGovernanceOutcome } from "../feedback/governance-feedback-classifier.service";
import { buildGovernanceTrainingRow } from "../feedback/governance-training-data.service";
import { persistGovernanceFeedbackRecord } from "../feedback/governance-feedback.repository";
import type { ExecutionResult } from "../types/domain.types";
import type { ProposedAction } from "../types/domain.types";

/** Optional governance snapshot + routing hints for outcome feedback (additive). */
export type VerifyExecutionContext = {
  actionType?: string;
  regionCode?: string;
  governance?: {
    disposition?: string;
    blocked?: boolean;
    requiresHumanApproval?: boolean;
    allowExecution?: boolean;
    policyDecision?: string;
    legalRisk?: { score: number; level: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL" };
    fraudRisk?: {
      score: number;
      level: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
      revenueImpactEstimate?: number;
    };
    combinedRisk?: { score: number; level: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL" };
    trace?: GovernancePredictionSnapshot["trace"];
  };
};

export type VerifyOutcomeInput = {
  proposed: ProposedAction;
  execution: ExecutionResult;
  /** When set, verification outcome is recorded for governance feedback (non-blocking). */
  executionContext?: VerifyExecutionContext;
};

export type VerifyOutcomeResult = {
  verified: boolean;
  reversible: boolean;
  notes: string;
};

function riskLevel(
  v: string | undefined,
): "LOW" | "MEDIUM" | "HIGH" | "CRITICAL" {
  if (v === "LOW" || v === "MEDIUM" || v === "HIGH" || v === "CRITICAL") return v;
  return "LOW";
}

/** Fire-and-forget — keeps verifyActionOutcome synchronous for callers. */
function scheduleGovernanceFeedbackAfterVerification(
  input: VerifyOutcomeInput,
  verificationResult: VerifyOutcomeResult,
): void {
  void (async () => {
    try {
      const g = input.executionContext?.governance;
      const prediction: GovernancePredictionSnapshot = {
        governanceDisposition: g?.disposition ?? "UNKNOWN",
        blocked: g?.blocked ?? false,
        requiresHumanApproval: g?.requiresHumanApproval ?? false,
        allowExecution: g?.allowExecution ?? false,
        policyDecision: g?.policyDecision,
        legalRiskScore: g?.legalRisk?.score ?? 0,
        legalRiskLevel: riskLevel(g?.legalRisk?.level),
        fraudRiskScore: g?.fraudRisk?.score ?? 0,
        fraudRiskLevel: riskLevel(g?.fraudRisk?.level),
        combinedRiskScore: g?.combinedRisk?.score ?? 0,
        combinedRiskLevel: riskLevel(g?.combinedRisk?.level),
        revenueImpactEstimate: g?.fraudRisk?.revenueImpactEstimate ?? 0,
        trace: g?.trace ?? [],
      };

      const truthEvents = [
        {
          type: verificationResult.verified ? ("execution_succeeded" as const) : ("execution_failed" as const),
          occurredAt: new Date().toISOString(),
        },
      ];

      const feedback = classifyGovernanceOutcome({
        actionType: input.executionContext?.actionType ?? input.proposed.type,
        regionCode: input.executionContext?.regionCode,
        entityType: input.proposed.target?.type,
        entityId: input.proposed.target?.id ?? undefined,
        prediction,
        truthEvents,
      });

      const trainingRow = buildGovernanceTrainingRow({
        input: {
          actionType: input.executionContext?.actionType ?? input.proposed.type,
          regionCode: input.executionContext?.regionCode,
          entityType: input.proposed.target?.type,
          entityId: input.proposed.target?.id ?? undefined,
          prediction,
          truthEvents,
        },
        result: feedback,
      });

      await persistGovernanceFeedbackRecord({
        input: {
          actionType: input.executionContext?.actionType ?? input.proposed.type,
          regionCode: input.executionContext?.regionCode,
          entityType: input.proposed.target?.type,
          entityId: input.proposed.target?.id ?? undefined,
          prediction,
          truthEvents,
        },
        result: feedback,
        trainingRow: trainingRow as unknown as Record<string, unknown>,
      });
    } catch (e) {
      console.warn("[governance:feedback:execution]", e);
    }
  })();
}

/** Deterministic verification — listing/lead executors are dry-run-only; EXECUTED paths are advisory. Never throws. */
export function verifyActionOutcome(input: VerifyOutcomeInput): VerifyOutcomeResult {
  const { execution } = input;
  let result: VerifyOutcomeResult;

  if (execution.status === "DRY_RUN") {
    result = {
      verified: true,
      reversible: true,
      notes: "dry_run_no_live_mutations_to_verify",
    };
  } else if (execution.status === "EXECUTED") {
    const advisory = execution.metadata?.advisory === true || execution.metadata?.observabilityOnly === true;
    result = {
      verified: advisory,
      reversible: advisory,
      notes: advisory ? "advisory_exec_recorded" : "exec_without_advisory_flag",
    };
  } else {
    result = {
      verified: false,
      reversible: false,
      notes: `status_${execution.status}`,
    };
  }

  scheduleGovernanceFeedbackAfterVerification(input, result);

  return result;
}

export function verifyBatchOutcome(
  items: VerifyOutcomeInput[],
): { results: VerifyOutcomeResult[] } {
  return {
    results: items.map((i) => verifyActionOutcome(i)),
  };
}
