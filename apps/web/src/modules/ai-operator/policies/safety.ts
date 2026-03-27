import type { AiOperatorActionType } from "@/src/modules/ai-operator/domain/operator.enums";

/** Types that must never run without explicit human approval (no auto-send, no auto-billing). */
const ALWAYS_APPROVAL_TYPES: AiOperatorActionType[] = [
  "contact_lead",
  "follow_up_lead",
  "send_message",
  "publish_content",
  "adjust_price",
  "generate_draft",
  "trigger_upgrade_prompt",
];

/** Only non-destructive navigation / illustration — still logged. */
const AUTO_RESTRICTED_ALLOWED: AiOperatorActionType[] = ["run_simulation"];

export function requiresExplicitApproval(type: AiOperatorActionType): boolean {
  return ALWAYS_APPROVAL_TYPES.includes(type);
}

export function allowedInAutoRestrictedMode(type: AiOperatorActionType): boolean {
  return AUTO_RESTRICTED_ALLOWED.includes(type);
}

/** No outbound messages or payments from executeAction without approved + policy. */
export function isDestructiveOrOutbound(type: AiOperatorActionType): boolean {
  return type === "send_message" || type === "publish_content" || type === "contact_lead" || type === "follow_up_lead";
}

export function assertSafeToExecute(type: AiOperatorActionType, wasExplicitlyApproved: boolean): void {
  if (isDestructiveOrOutbound(type) && !wasExplicitlyApproved) {
    throw new Error("Policy: outbound or contact actions require explicit approval");
  }
}
