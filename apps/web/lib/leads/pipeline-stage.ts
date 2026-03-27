/**
 * Normalized sales pipeline stages (CRM + kanban).
 * Legacy DB values: meeting → meeting_scheduled, in_progress → closing, closed → won.
 */

export const SALES_PIPELINE_STAGES = [
  "new",
  "contacted",
  "qualified",
  "meeting_scheduled",
  "negotiation",
  "closing",
  "won",
  "lost",
] as const;

export type SalesPipelineStage = (typeof SALES_PIPELINE_STAGES)[number];

export const STAGE_COLUMN_LABEL: Record<string, string> = {
  new: "New",
  contacted: "Contacted",
  qualified: "Qualified",
  meeting_scheduled: "Meeting scheduled",
  meeting: "Meeting scheduled",
  negotiation: "Negotiation",
  closing: "Closing",
  in_progress: "Closing",
  won: "Won",
  closed: "Won",
  lost: "Lost",
  follow_up: "Contacted",
};

/** Map legacy / API input to canonical stage for columns. */
export function normalizePipelineStage(raw: string | null | undefined): SalesPipelineStage {
  const s = (raw ?? "new").trim().toLowerCase();
  if (s === "follow_up" || s === "awaiting_reply") return "contacted";
  if (s === "meeting") return "meeting_scheduled";
  if (s === "in_progress") return "closing";
  if (s === "closed") return "won";
  if (
    s === "new" ||
    s === "contacted" ||
    s === "qualified" ||
    s === "meeting_scheduled" ||
    s === "negotiation" ||
    s === "closing" ||
    s === "won" ||
    s === "lost"
  ) {
    return s;
  }
  return "new";
}

/**
 * Storage value for DB: canonical stage names (migrate legacy on read via normalize).
 */
export function toStoredPipelineStatus(columnStage: string): string {
  const n = normalizePipelineStage(columnStage);
  if (n === "meeting_scheduled") return "meeting_scheduled";
  return n;
}

/**
 * Default next reminder when entering a stage (brokers can override).
 */
export function defaultNextTouchForStage(stage: string): Date | null {
  const s = normalizePipelineStage(stage);
  if (s === "won" || s === "lost") return null;
  const now = Date.now();
  if (s === "new") return new Date(now + 10 * 60 * 1000);
  if (s === "contacted") return new Date(now + 24 * 60 * 60 * 1000);
  if (s === "qualified") return new Date(now + 2 * 24 * 60 * 60 * 1000);
  if (s === "meeting_scheduled") return new Date(now + 24 * 60 * 60 * 1000);
  if (s === "negotiation") return new Date(now + 48 * 60 * 60 * 1000);
  if (s === "closing") return new Date(now + 24 * 60 * 60 * 1000);
  return null;
}
