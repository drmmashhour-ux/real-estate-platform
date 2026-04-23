export {
  DEFAULT_DOMINATION_WEIGHTS,
  DEFAULT_PRIORITIZATION_WEIGHTS,
  DEFAULT_READINESS_WEIGHTS,
  type DominationWeights,
  type PrioritizationWeights,
  type ReadinessWeights,
} from "./market-domination.config";

export type {
  CompetitorPressureView,
  CompetitorRecord,
  ExpansionReadiness,
  GapType,
  HubPenetrationResult,
  HubType,
  MarketGap,
  PenetrationBand,
  PrioritizedMarket,
  StrategicRecommendation,
  Territory,
  TerritoryDomination,
  TerritoryExplainability,
  TerritoryMetrics,
  TerritoryScope,
} from "./market-domination.types";

export { computeHubPenetration } from "./market-penetration.service";
export { analyzeMarketGaps } from "./market-gap-analysis.service";
export { scoreExpansionReadiness } from "./market-expansion-readiness.service";
export {
  buildCompetitorPressureView,
  competitorPressureScore,
  competitorsForTerritory,
  listCompetitors,
  resetCompetitorStoreForTests,
  upsertCompetitor,
} from "./market-competitor-tracking.service";
export { prioritizeMarkets } from "./market-prioritization.service";
export { explainRecommendation, explainTerritoryScore } from "./market-domination-explainability.service";

export type {
  MarketDominationAlert,
  MarketDominationSnapshot,
  MarketDominationState,
  TerritoryTrendPoint,
} from "./market-domination.service";

export {
  buildMarketDominationAlerts,
  buildMarketDominationSnapshot,
  buildStrategicRecommendations,
  buildSyntheticTrendHistory,
  computeTerritoryDomination,
  defaultSeedTerritories,
  ensureDemoCompetitors,
  getTerritoryDetail,
  loadTerritories,
  resetMarketDominationStateForTests,
  saveTerritories,
} from "./market-domination.service";

export { buildMarketDominationMobileSummary } from "./market-domination-mobile.service";
