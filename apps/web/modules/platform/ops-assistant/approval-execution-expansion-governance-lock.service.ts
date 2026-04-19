/**
 * Gates any future “scope expansion” workflow for approval execution (policy hooks).
 * Does not activate or widen execution — only reports whether governance preconditions are met.
 */

import type { ApprovalExecutionOutcomeSummary } from "./approval-execution-results.types";
import {
  GOVERNANCE_EXPANSION_GATE_MESSAGE,
  GOVERNANCE_NO_AUTO_EXPANSION_MESSAGE,
} from "./approval-execution-review.types";
import { prepareGovernanceReviewState } from "./approval-execution-review.service";

export type ApprovalExecutionExpansionGovernanceGate = {
  /** True while manual review is incomplete, rollback is active, or consideration path is not cleared. */
  blocksFutureScopeWorkflow: boolean;
  expansionConsiderationPathCleared: boolean;
  governanceRollbackActive: boolean;
  resultsExist: boolean;
  primaryBlockerMessage: string;
  noAutomaticActivationMessage: string;
};

/**
 * Future expansion workflows must consult this gate first.
 * Even when `blocksFutureScopeWorkflow` is false, code must still respect `APPROVAL_EXECUTION_EXPANSION_LOCKED`
 * and ship no new executable kinds without an explicit engineering change.
 */
export function evaluateApprovalExecutionFutureExpansionGate(
  summary: ApprovalExecutionOutcomeSummary,
): ApprovalExecutionExpansionGovernanceGate {
  const state = prepareGovernanceReviewState(summary);
  const { expansionConsiderationPathCleared, governanceRollbackActive, resultsExist } = state.summary;

  let primaryBlockerMessage = GOVERNANCE_EXPANSION_GATE_MESSAGE;
  if (governanceRollbackActive) {
    primaryBlockerMessage =
      "Governance rollback is active — treat scope as rollback candidate and resolve before any expansion consideration.";
  } else if (!resultsExist) {
    primaryBlockerMessage = "Approval execution evidence is missing — complete measurement before governance review.";
  } else if (!expansionConsiderationPathCleared) {
    primaryBlockerMessage = GOVERNANCE_EXPANSION_GATE_MESSAGE;
  }

  const blocksFutureScopeWorkflow =
    governanceRollbackActive || !resultsExist || !expansionConsiderationPathCleared;

  return {
    blocksFutureScopeWorkflow,
    expansionConsiderationPathCleared,
    governanceRollbackActive,
    resultsExist,
    primaryBlockerMessage,
    noAutomaticActivationMessage: GOVERNANCE_NO_AUTO_EXPANSION_MESSAGE,
  };
}
