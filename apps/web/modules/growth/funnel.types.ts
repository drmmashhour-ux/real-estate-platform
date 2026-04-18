export type LeadFunnelStage =
  | "new"
  | "contacted"
  | "qualified"
  | "showing"
  | "offer"
  | "closed";

export type LeadFunnelSummary = {
  total: number;
  byStage: Record<LeadFunnelStage, number>;
  /** Share of mapped pipeline leads in `closed` (won/closed) vs total in funnel stages. */
  conversionRate: number;
};

export type LeadFunnelRow = {
  id: string;
  pipelineStatus: string;
  pipelineStage?: string | null;
  score?: number | null;
  lastContactedAt?: Date | null;
  meetingScheduledAt?: Date | null;
};
