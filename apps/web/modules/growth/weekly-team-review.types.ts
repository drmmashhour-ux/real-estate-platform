/**
 * Team operating review — meeting-oriented summary; advisory only, no financial guarantee.
 */

export type WeeklyTeamReviewConfidence = "low" | "medium" | "high";

export type WeeklyTeamExecutionBlock = {
  tasksCompleted: number;
  tasksInProgress: number;
  tasksBlocked: number;
  /** 0–1 from execution accountability aggregate when available. */
  completionRate: number;
};

export type WeeklyTeamPipelineBlock = {
  leadsCaptured: number;
  leadsQualified: number;
  meetingsBooked: number;
  dealsProgressed: number;
  dealsClosed: number;
};

export type WeeklyTeamPerformanceBlock = {
  topCity: string | null;
  weakestCity: string | null;
  biggestImprovement: string | null;
  biggestDrop: string | null;
};

export type WeeklyTeamDealInsights = {
  dropOffStage: string | null;
  strongestStage: string | null;
  scriptUsageHighlights: string[];
};

export type RolePerformanceRow = {
  role: string;
  done: number;
  inProgress: number;
  blocked: number;
  label: string;
};

export type WorkloadDistributionRow = {
  label: string;
  value: number;
  note: string;
};

export type WeeklyTeamReview = {
  periodStart: string;
  periodEnd: string;
  execution: WeeklyTeamExecutionBlock;
  pipeline: WeeklyTeamPipelineBlock;
  performance: WeeklyTeamPerformanceBlock;
  dealInsights: WeeklyTeamDealInsights;
  team: {
    rolePerformance: RolePerformanceRow[];
    workloadDistribution: WorkloadDistributionRow[];
  };
  recommendations: {
    priorities: string[];
    corrections: string[];
    focusAreas: string[];
  };
  analysis: {
    /** Free-text labels; not an enum to keep engine extensible. */
    positive: string[];
    negative: string[];
    neutral: string[];
    insufficient: string[];
  };
  meta: {
    confidence: WeeklyTeamReviewConfidence;
    warnings: string[];
  };
};
