export type MobileApprovalKind =
  | "communication_draft_approve"
  | "negotiation_suggestion_approve"
  | "broker_task_complete"
  | "deal_request_item_received"
  | "noop_ack";

export type MobileApprovalResult =
  | { ok: true; kind: MobileApprovalKind; entityId: string }
  | { ok: false; error: string };
