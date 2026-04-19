/**
 * Aggregates approval execution evidence — read-only analytics; never mutates product state.
 */

import { isApprovalExecutableActionKind } from "./approval-execution.types";
import type { ApprovalExecutionRequest } from "./approval-execution.types";
import { decideApprovalExecutionOutcome } from "./approval-execution-decision.service";
import { recordApprovalResultsComputed } from "./approval-execution-results-monitoring.service";
import type {
  ApprovalExecutionMeasurementWindow,
  ApprovalExecutionOutcomeByAction,
  ApprovalExecutionOutcomeSummary,
} from "./approval-execution-results.types";
import { evaluateApprovalSafety } from "./approval-execution-safety.service";
import { evaluateApprovalUsefulness } from "./approval-execution-usefulness.service";
import { getApprovalMonitoringSnapshot } from "./approval-execution-monitoring.service";
import { listAuditSorted, listRequestsSorted } from "./approval-execution.store";

const MIN_SAMPLE_REQUESTS = 5;

function filterBySince(requests: ApprovalExecutionRequest[], sinceIso?: string): ApprovalExecutionRequest[] {
  if (!sinceIso) return requests;
  const t = Date.parse(sinceIso);
  if (Number.isNaN(t)) return requests;
  return requests.filter((r) => Date.parse(r.createdAt) >= t);
}

function emptySummary(window: ApprovalExecutionMeasurementWindow): ApprovalExecutionOutcomeSummary {
  return {
    window,
    totals: {
      requestCount: 0,
      approvalCount: 0,
      denialCount: 0,
      executionCount: 0,
      undoCount: 0,
      failureCount: 0,
      blockedBySafetyCount: 0,
    },
    rates: {
      approvalRate: 0,
      executionSuccessRate: 0,
      undoRate: 0,
      failureRate: 0,
    },
    byActionType: [],
    operatorFeedbackSummary: "No structured operator feedback captured yet — signals are usage-only.",
    safetyEvaluation: "safe",
    usefulnessEvaluation: "insufficient_data",
    finalDecision: "insufficient_data",
    explanation:
      "No approval execution data in this window. Continue operating normally; measurement will populate after requests flow.",
  };
}

export function buildApprovalExecutionOutcomeSummary(opts?: {
  sinceIso?: string;
  untilIso?: string;
}): ApprovalExecutionOutcomeSummary {
  const window: ApprovalExecutionMeasurementWindow = {
    label: opts?.sinceIso ? `since ${opts.sinceIso}` : "all stored requests",
    sinceIso: opts?.sinceIso,
    untilIso: opts?.untilIso,
  };

  let requests = listRequestsSorted();
  requests = filterBySince(requests, opts?.sinceIso);

  if (requests.length === 0) {
    const empty = emptySummary(window);
    recordApprovalResultsComputed({
      decision: empty.finalDecision,
      safety: empty.safetyEvaluation,
      usefulness: empty.usefulnessEvaluation,
      insufficientData: true,
    });
    return empty;
  }

  let allowlistViolation = false;
  for (const r of requests) {
    if (!isApprovalExecutableActionKind(r.actionType)) {
      allowlistViolation = true;
      break;
    }
  }

  const denied = requests.filter((r) => r.status === "denied").length;
  const failed = requests.filter((r) => r.status === "failed").length;
  const cancelled = requests.filter((r) => r.status === "cancelled").length;
  const executed = requests.filter((r) => r.status === "executed").length;

  const approvalCount = requests.filter((r) => Boolean(r.approvedAt)).length;
  const executionAttempts = executed + failed + cancelled;

  const denomSuccess = executed + cancelled;
  const denomExecOutcome = Math.max(1, failed + executed + cancelled);

  const executionSuccessRate = (executed + cancelled) / denomExecOutcome;
  const undoRate = cancelled / Math.max(1, denomSuccess + cancelled);
  const failureRate = failed / denomExecOutcome;

  const approvalRate =
    approvalCount + denied > 0 ? approvalCount / (approvalCount + denied) : 0;

  const audit = listAuditSorted(2000);
  const createdAudit = audit.filter((a) => a.kind === "request_created").length;
  const auditTrailGapRatio =
    requests.length > 0 ? Math.max(0, 1 - Math.min(1, createdAudit / requests.length)) : 0;

  const mon = getApprovalMonitoringSnapshot();

  const byActionMap = new Map<string, ApprovalExecutionOutcomeByAction>();
  for (const r of requests) {
    const k = r.actionType;
    const cur = byActionMap.get(k) ?? {
      actionType: r.actionType,
      requestCount: 0,
      approvalCount: 0,
      executionCount: 0,
      undoCount: 0,
      failureCount: 0,
    };
    cur.requestCount += 1;
    if (r.approvedAt) cur.approvalCount += 1;
    if (r.status === "executed" || r.status === "failed" || r.status === "cancelled") cur.executionCount += 1;
    if (r.status === "cancelled") cur.undoCount += 1;
    if (r.status === "failed") cur.failureCount += 1;
    byActionMap.set(k, cur);
  }
  const byActionType = [...byActionMap.values()].sort((a, b) => a.actionType.localeCompare(b.actionType));

  const insufficientData = requests.length < MIN_SAMPLE_REQUESTS;

  const safety = evaluateApprovalSafety({
    totalRequests: requests.length,
    executionCount: executionAttempts,
    undoCount: cancelled,
    failureCount: failed,
    blockedBySafetyCount: mon.blockedBySafety,
    undoRate,
    failureRate,
    auditTrailGapRatio,
    allowlistViolation,
  });

  const usefulness = evaluateApprovalUsefulness({
    totalRequests: requests.length,
    executionCount: executionAttempts,
    executedSuccessCount: executed + cancelled,
    failureCount: failed,
    undoCount: cancelled,
    approvalCount,
    executionSuccessRate,
    undoRate,
  });

  const decided = decideApprovalExecutionOutcome({
    insufficientData,
    safety: safety.score,
    usefulness: usefulness.score,
    undoRate,
    failureRate,
    executionCount: executionAttempts,
  });

  const explanation = [
    decided.explanation,
    ...safety.reasons.slice(0, 2).map((x) => `(Safety) ${x}`),
    ...usefulness.reasons.slice(0, 2).map((x) => `(Usefulness) ${x}`),
  ].join(" ");

  recordApprovalResultsComputed({
    decision: decided.decision,
    safety: safety.score,
    usefulness: usefulness.score,
    insufficientData,
  });

  return {
    window,
    totals: {
      requestCount: requests.length,
      approvalCount,
      denialCount: denied,
      executionCount: executionAttempts,
      undoCount: cancelled,
      failureCount: failed,
      blockedBySafetyCount: mon.blockedBySafety,
    },
    rates: {
      approvalRate,
      executionSuccessRate,
      undoRate,
      failureRate,
    },
    byActionType,
    operatorFeedbackSummary: "No structured operator feedback captured yet — signals are usage-only.",
    safetyEvaluation: safety.score,
    usefulnessEvaluation: usefulness.score,
    finalDecision: decided.decision,
    explanation,
  };
}
