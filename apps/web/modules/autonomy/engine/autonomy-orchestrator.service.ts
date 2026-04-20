import type { ProposedAction } from "../types/autonomy.types";

import { logAutonomy } from "../lib/autonomy-log";
import { evaluateAutonomyPolicies } from "../policy/autonomy-policy.service";

export function createProposedAction(input: {
  domain: ProposedAction["domain"];
  type: string;
  title: string;
  description: string;
  mode: ProposedAction["mode"];
  payload: Record<string, unknown>;
  expectedImpact?: ProposedAction["expectedImpact"];
}): ProposedAction {
  const policy = evaluateAutonomyPolicies({
    mode: input.mode,
    domain: input.domain,
    payload: input.payload,
    estimatedImpact: input.expectedImpact,
  });

  const id =
    typeof globalThis.crypto !== "undefined" && "randomUUID" in globalThis.crypto
      ? globalThis.crypto.randomUUID()
      : `action-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

  return {
    id,
    domain: input.domain,
    type: input.type,
    title: input.title,
    description: input.description,
    mode: input.mode,
    status: policy.allowed
      ? policy.requiresHumanApproval
        ? "PENDING_APPROVAL"
        : "DRAFT"
      : "SKIPPED",
    payload: input.payload,
    policyResults: policy.results,
    expectedImpact: input.expectedImpact,
    createdAt: new Date().toISOString(),
  };
}

export function approveProposedAction(action: ProposedAction): ProposedAction {
  return {
    ...action,
    status: "APPROVED",
    approvedAt: new Date().toISOString(),
  };
}

export function markExecuted(action: ProposedAction): ProposedAction {
  return {
    ...action,
    status: "EXECUTED",
    executedAt: new Date().toISOString(),
  };
}

export function markRolledBack(action: ProposedAction): ProposedAction {
  logAutonomy("[autonomy:action:rollback]", { actionId: action.id });
  return {
    ...action,
    status: "ROLLED_BACK",
    rolledBackAt: new Date().toISOString(),
  };
}
