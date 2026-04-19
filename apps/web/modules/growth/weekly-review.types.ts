/**
 * Weekly operator review — measurement + prioritization language only; no automation.
 */

export type WeeklyReviewConfidence = "low" | "medium" | "high";

export type WeeklyReviewSummary = {
  periodStart: string;
  periodEnd: string;
  execution: {
    leadsCaptured: number;
    brokersSourced: number;
    playbooksCompleted: number;
  };
  performance: {
    topCity: string | null;
    weakestCity: string | null;
    majorChanges: string[];
  };
  outcomes: {
    positiveSignals: string[];
    negativeSignals: string[];
    insufficientSignals: string[];
  };
  recommendations: {
    nextActions: string[];
    priorityFocus: string[];
  };
  meta: {
    confidence: WeeklyReviewConfidence;
    warnings: string[];
  };
};
