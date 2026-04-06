/**
 * Which action keys may run without approval, with guardrails, or never auto-run.
 */

export type ActionRisk = "safe" | "guardrail" | "requires_approval" | "forbidden";

const SAFE = new Set([
  "draft_listing_copy",
  "draft_message",
  "summarize_dispute",
  "summarize_booking",
  "recommend_promotion",
  "review_promotion",
  "internal_note",
  "search_docs",
  "dismiss_recommendation",
]);

const GUARDRAIL = new Set([
  "suggest_listing_fields",
  "create_recommendation_row",
  "create_in_app_task",
  "mark_booking_needs_review",
]);

const REQUIRES_APPROVAL = new Set([
  "set_listing_price_live",
  "send_guest_message",
  "issue_refund",
  "set_booking_status",
  "modify_payout_settings",
  "publish_listing_change",
]);

const FORBIDDEN = new Set([
  "fabricate_metrics",
  "legal_advice_as_fact",
  "direct_payment_record_edit",
  "auto_refund_without_policy",
]);

export function classifyActionKey(actionKey: string): ActionRisk {
  if (FORBIDDEN.has(actionKey)) return "forbidden";
  if (REQUIRES_APPROVAL.has(actionKey)) return "requires_approval";
  if (GUARDRAIL.has(actionKey)) return "guardrail";
  if (SAFE.has(actionKey)) return "safe";
  return "requires_approval";
}

export function mayAutoExecute(actionKey: string, allowSafeAutopilot: boolean): boolean {
  const r = classifyActionKey(actionKey);
  if (r === "forbidden") return false;
  if (r === "requires_approval") return false;
  if (r === "guardrail") return allowSafeAutopilot;
  return allowSafeAutopilot && r === "safe";
}
