/**
 * AI Broker Autopilot — allowed vs blocked internal actions.
 * No external messaging, no financial/legal execution from this layer.
 */

/** Autopilot may adjust prioritization metadata only — never send messages or move money. */
export const AUTOPILOT_ALLOWED_INTERNAL_ACTIONS = new Set([
  "mark_qualified",
  "suggest_follow_up",
  "tag_lead",
  "rescore_priority",
  "playbook_recommendation",
]);

/** Block external comms and financial / legal execution from autopilot (suggest-only layer). */
export const AUTOPILOT_BLOCKED_ACTION_PREFIXES = [
  "send_",
  "message_",
  "sms_",
  "email_",
  "payment_",
  "charge_",
  "payout_",
  "disburse_",
  "wire_",
  "escrow_",
  "notarize_",
  "execute_payment",
  "auto_sign",
  "sign_contract",
  "legal_file",
];

export function isAutopilotActionSafe(actionType: string, reasonBucket?: string | null): boolean {
  const t = (actionType ?? "").toLowerCase();
  if (!t) return false;
  if (AUTOPILOT_BLOCKED_ACTION_PREFIXES.some((p) => t.startsWith(p))) return false;
  if (reasonBucket === "playbook_recommendation") return true;
  return AUTOPILOT_ALLOWED_INTERNAL_ACTIONS.has(t);
}
