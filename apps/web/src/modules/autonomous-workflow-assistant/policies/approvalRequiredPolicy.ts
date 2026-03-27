/** Irreversible or legally significant actions — never auto-execute. */
export const RESTRICTED_WITHOUT_APPROVAL = new Set([
  "finalize_document",
  "approve_document",
  "send_signature_request",
  "change_legal_facts",
  "resolve_contradiction",
  "override_validation",
  "export_binding_pdf",
]);

/** Autonomous task types that always require explicit human confirmation (never auto-finalize). */
export const RESTRICTED_TASK_TYPES = new Set([
  "finalize_document",
  "approve_document",
  "send_signature_request",
  "change_legal_facts",
  "resolve_contradiction",
  "override_validation",
  "export_binding_pdf",
]);

export function requiresHumanApproval(actionType: string): boolean {
  return RESTRICTED_WITHOUT_APPROVAL.has(actionType);
}

export function isRestrictedTaskType(taskType: string): boolean {
  return RESTRICTED_TASK_TYPES.has(taskType);
}

export function resolveTaskApprovalFlags<T extends { taskType: string; requiresApproval: boolean }>(step: T): T {
  if (RESTRICTED_TASK_TYPES.has(step.taskType)) {
    return { ...step, requiresApproval: true };
  }
  return step;
}
