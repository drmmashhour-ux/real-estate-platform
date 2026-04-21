import type { LecipmBrokerCrmLeadStatus } from "@prisma/client";

/**
 * Canonical CRM pipeline — maps to `LecipmBrokerCrmLeadStatus` (broker inquiry CRM).
 * Platform `Lead` / enterprise `LecipmCrmPipelineLead` use separate tables; automation hooks target broker CRM first.
 */
export const BROKER_CRM_KANBAN_COLUMNS = [
  "new",
  "contacted",
  "qualified",
  "deal_stage",
  "closed",
] as const;

export type BrokerCrmKanbanColumn = (typeof BROKER_CRM_KANBAN_COLUMNS)[number];

/** Maps DB status → Kanban column id (deal_stage = active deal work). */
export function brokerCrmStatusToKanbanColumn(status: LecipmBrokerCrmLeadStatus): BrokerCrmKanbanColumn {
  if (status === "closed" || status === "lost") return "closed";
  if (status === "visit_scheduled" || status === "negotiating") return "deal_stage";
  if (status === "qualified") return "qualified";
  if (status === "contacted") return "contacted";
  return "new";
}

export const KANBAN_COLUMN_LABEL: Record<BrokerCrmKanbanColumn, string> = {
  new: "New",
  contacted: "Contacted",
  qualified: "Qualified",
  deal_stage: "Deal",
  closed: "Closed / Lost",
};

export type PipelineActivityKind =
  | "lead_created"
  | "email_opened"
  | "listing_viewed"
  | "message_sent"
  | "call_completed"
  | "visit_scheduled"
  | "deal_created"
  | "status_manual_change";

export type PipelineEngineInput = {
  /** Current broker CRM status */
  currentStatus: LecipmBrokerCrmLeadStatus;
  activity: PipelineActivityKind;
  /** Optional signals */
  intentScore?: number;
  priorityLabel?: "low" | "medium" | "high";
};

export type PipelineEngineOutput = {
  /** Suggested next broker CRM status */
  nextStatus: LecipmBrokerCrmLeadStatus;
  recommendedActions: string[];
  rationale: string[];
};
