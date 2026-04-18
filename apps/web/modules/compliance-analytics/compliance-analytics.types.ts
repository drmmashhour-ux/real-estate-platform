export type ComplianceAnalyticsWindow = "today" | "7d" | "30d" | "quarter" | "custom";

export type ComplianceAnalyticsPayload = {
  window: ComplianceAnalyticsWindow;
  openCases: number;
  criticalCases: number;
  avgReviewTurnaroundDays: number | null;
  changesRequiredRate: number | null;
  escalationRate: number | null;
  topFindingCategories: { caseType: string; count: number }[];
  blockedClosings: number;
  generatedAt: string;
  disclaimer: string;
};
