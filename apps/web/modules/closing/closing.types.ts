export type ClosingRoomReadiness = {
  readinessStatus: "NOT_READY" | "PARTIALLY_READY" | "READY";
  blockers: string[];
  nextSteps: string[];
};

export type ClosingPipelineSummary = {
  totalClosingDeals: number;
  readyToClose: number;
  blockedClosings: number;
  missingDocumentsCount: number;
  pendingSignaturesCount: number;
  checklistCompletionRate: number;
  dealsAtRisk: Array<{ dealId: string; title: string; reason: string }>;
};

/** Checklist rows with priority `OPTIONAL` are informational only for final readiness (ESG row when N/A). */
export function checklistItemCountsForClosing(priority: string | null): boolean {
  const p = priority?.trim().toUpperCase() ?? "";
  return p !== "OPTIONAL";
}
