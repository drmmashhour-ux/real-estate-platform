export type ExecutiveAnalyticsSnapshot = {
  generatedAt: string;
  insightsGeneratedApprox: number;
  highUrgencyPrioritiesApprox: number;
  founderActionCompletionRate: number | null;
  repeatedBottleneckHints: string[];
  briefingGenerationCount30d: number;
  topRiskCategories: { category: string; count: number }[];
  topOpportunityCategories: { category: string; count: number }[];
};
