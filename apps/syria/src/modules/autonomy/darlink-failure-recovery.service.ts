/**
 * Deterministic failure classification — no automatic retries.
 */

export type MarketplaceFailureClass =
  | "rollback_recommended"
  | "manual_review_required"
  | "retry_not_recommended"
  | "state_conflict_detected";

export function classifyMarketplaceFailure(params: {
  handlerCode: string;
  gateBlocked?: boolean;
}): MarketplaceFailureClass {
  try {
    if (params.handlerCode === "confirmed_unpaid_inconsistent") {
      return "state_conflict_detected";
    }
    if (params.handlerCode === "fraud_blocked") {
      return "manual_review_required";
    }
    if (params.gateBlocked) {
      return "manual_review_required";
    }
    if (params.handlerCode === "handler_error" || params.handlerCode === "persist_failed") {
      return "retry_not_recommended";
    }
    return "manual_review_required";
  } catch {
    return "manual_review_required";
  }
}

export function recommendMarketplaceRecovery(cls: MarketplaceFailureClass): readonly string[] {
  switch (cls) {
    case "rollback_recommended":
      return ["inspect_audit_log", "rollback_if_safe"];
    case "manual_review_required":
      return ["assign_admin", "freeze_automation"];
    case "retry_not_recommended":
      return ["inspect_logs", "fix_root_cause_before_retry"];
    case "state_conflict_detected":
      return ["reconcile_booking_payment_state_manually"];
    default:
      return [];
  }
}
