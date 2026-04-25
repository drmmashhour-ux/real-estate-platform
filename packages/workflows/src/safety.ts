import { WORKFLOW_REGISTRY } from "@/lib/workflows/types";

const AUTO_EXEC_IN_JSON = /\"(executeNow|autoExecute|autoRun)\"\s*:\s*true/i;

export class WorkflowSafetyError extends Error {
  constructor(public readonly code: string) {
    super(code);
    this.name = "WorkflowSafetyError";
  }
}

export function assertNoAutoExecutionInPlanJson(raw: string): void {
  if (AUTO_EXEC_IN_JSON.test(raw)) {
    throw new WorkflowSafetyError("AUTO_EXECUTION_FORBIDDEN");
  }
}

export function mergeRequiresApproval(workflowType: string, aiFlag: boolean): boolean {
  const reg = WORKFLOW_REGISTRY[workflowType];
  if (reg?.regulated) return true;
  if (reg?.requiresApproval === false) return false;
  if (reg?.requiresApproval === true) return true;
  return aiFlag;
}

export function assertRegulatedWorkflowApprovedForExecution(
  workflowType: string,
  status: string
): void {
  const reg = WORKFLOW_REGISTRY[workflowType];
  if (reg?.regulated && status !== "approved") {
    throw new WorkflowSafetyError("REGULATED_ACTION_REQUIRES_APPROVAL");
  }
}

export function assertDraftContractConfirmed(
  workflowType: string,
  steps: { type: string }[],
  regulatedConfirmed: boolean | undefined
): void {
  const hasDraft = workflowType === "draft_contract" || steps.some((s) => s.type === "draft_contract");
  if (hasDraft && !regulatedConfirmed) {
    throw new WorkflowSafetyError("REGULATED_ACTION_REQUIRES_APPROVAL");
  }
}
