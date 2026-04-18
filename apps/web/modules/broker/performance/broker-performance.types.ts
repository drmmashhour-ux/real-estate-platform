/**
 * Broker performance + marketplace ranking V1 — advisory scoring only (no access control side-effects).
 */

export type BrokerPerformanceBand = "low" | "watch" | "good" | "strong";

export type BrokerPerformanceBreakdown = {
  responseSpeedScore: number;
  contactRateScore: number;
  engagementScore: number;
  closeSignalScore: number;
  retentionScore: number;
};

export type BrokerPerformanceRecommendation = {
  id: string;
  title: string;
  description: string;
  impact: "low" | "medium" | "high";
  why: string;
};

export type BrokerPerformanceSummary = {
  brokerId: string;
  overallScore: number;
  band: BrokerPerformanceBand;
  breakdown: BrokerPerformanceBreakdown;
  strongSignals: string[];
  weakSignals: string[];
  recommendations: BrokerPerformanceRecommendation[];
  createdAt: string;
};

export type BrokerMarketplaceRanking = {
  brokerId: string;
  rankScore: number;
  band: BrokerPerformanceBand;
  why: string[];
};

export type BrokerRoutingReadinessSummary = {
  highQualityBrokers: number;
  needsImprovementBrokers: number;
  totalBrokersScored: number;
  routingExperimentsAdvisable: boolean;
  notes: string[];
};
