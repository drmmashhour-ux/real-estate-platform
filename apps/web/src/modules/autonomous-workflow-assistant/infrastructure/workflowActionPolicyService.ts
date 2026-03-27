import { isSafeAutomationAction } from "@/src/modules/autonomous-workflow-assistant/policies/safeActionsPolicy";
import { requiresHumanApproval } from "@/src/modules/autonomous-workflow-assistant/policies/approvalRequiredPolicy";

export function evaluateActionPolicy(actionType: string): { mayAutoExecute: boolean; requiresApproval: boolean } {
  if (requiresHumanApproval(actionType)) return { mayAutoExecute: false, requiresApproval: true };
  if (isSafeAutomationAction(actionType)) return { mayAutoExecute: true, requiresApproval: false };
  return { mayAutoExecute: false, requiresApproval: true };
}
