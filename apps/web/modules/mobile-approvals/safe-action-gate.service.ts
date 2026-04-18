import type { MobileApprovalKind } from "./mobile-approvals.types";

/** Destructive / legally operative actions are NOT allowed from quick mobile approval v1. */
const ALLOWED: Set<MobileApprovalKind> = new Set([
  "communication_draft_approve",
  "negotiation_suggestion_approve",
  "broker_task_complete",
  "deal_request_item_received",
  "noop_ack",
]);

export function isMobileQuickApprovalAllowed(kind: MobileApprovalKind): boolean {
  return ALLOWED.has(kind);
}

export function assertQuickApprovalEnabled(flags: { mobileQuickApprovals: boolean }): Response | null {
  if (!flags.mobileQuickApprovals) {
    return Response.json({ error: "Mobile quick approvals disabled" }, { status: 403 });
  }
  return null;
}
