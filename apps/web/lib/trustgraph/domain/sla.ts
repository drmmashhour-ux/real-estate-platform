export type SlaStateKind = "on_track" | "due_soon" | "overdue" | "escalated";

export type SlaStateSummaryDto = {
  caseId: string;
  state: SlaStateKind;
  dueAt: string | null;
  pausedReason: string | null;
};

export type LegalQueueSummaryDto = {
  overdueCount: number;
  dueSoonCount: number;
  escalatedCount: number;
  onTrackCount: number;
  avgReviewHoursEstimate: number | null;
};
