/**
 * City-by-city Fast Deal comparison — internal/admin decision intelligence only.
 * Not a public ranking; not causal proof.
 */

export type FastDealCityMetrics = {
  city: string;
  windowDays: number;
  activity: {
    sourcingSessions?: number;
    brokersFound?: number;
    leadsCaptured?: number;
  };
  execution: {
    playbookStarted?: number;
    playbookCompleted?: number;
    avgCompletionTimeHours?: number;
  };
  progression: {
    leadsQualified?: number;
    meetingsBooked?: number;
    dealsProgressed?: number;
    dealsClosed?: number;
  };
  derived: {
    captureRate?: number;
    playbookCompletionRate?: number;
    progressionRate?: number;
    closeRate?: number;
  };
  meta: {
    sampleSize: number;
    dataCompleteness: "high" | "medium" | "low";
    warnings: string[];
  };
};

export type FastDealCityRankEntry = FastDealCityMetrics & {
  performanceScore: number;
  confidence: "low" | "medium" | "high";
  scoringWarnings: string[];
};

export type FastDealCityComparison = {
  cities: FastDealCityRankEntry[];
  rankedCities: FastDealCityRankEntry[];
  insights: string[];
  generatedAt: string;
};
