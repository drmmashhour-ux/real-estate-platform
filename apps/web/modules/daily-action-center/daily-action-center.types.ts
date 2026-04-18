/**
 * Daily Action Center — Québec residential brokerage (action-first mobile).
 * Urgency reflects modelled priority from real rows — not marketing urgency.
 */

export type DailyActionUrgency = "must_do_now" | "do_today" | "do_this_week";

export type DailyActionType =
  | "urgent_deadline"
  | "missing_document_followup"
  | "signature_pending"
  | "financing_followup"
  | "negotiation_review"
  | "communication_draft"
  | "deposit_payment_followup"
  | "closing_blocker"
  | "compliance_review"
  | "crm_lead_followup"
  | "broker_task";

export type LinkedEntityType =
  | "deal"
  | "lecipm_broker_task"
  | "deal_closing_condition"
  | "negotiation_suggestion"
  | "lecipm_communication_draft"
  | "deal_request"
  | "deal_request_item"
  | "signature_session"
  | "deal_bank_coordination"
  | "compliance_case"
  | "lecipm_broker_crm_lead";

export type DailyAction = {
  id: string;
  type: DailyActionType;
  title: string;
  summary: string;
  urgency: DailyActionUrgency;
  linkedEntityType: LinkedEntityType;
  linkedEntityId: string;
  dealId?: string | null;
  dueAt?: string | null;
  recommendedAction: string;
  riskIfIgnored?: string | null;
  approvalRequired: boolean;
};

export type DailyActionFeed = {
  kind: "daily_action_feed_v1";
  generatedAt: string;
  mustDoNow: DailyAction[];
  doToday: DailyAction[];
  doThisWeek: DailyAction[];
  all: DailyAction[];
  disclaimers: string[];
};
