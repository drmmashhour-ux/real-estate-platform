export { buildInternalAdsCampaign, type InternalAdsCampaign } from "./ads-campaign.service";
export {
  generateAdsCopyBundle,
  type AdsAudience,
  type AdsCopyBundle,
  type GoogleAdsCopy,
  type SocialAdsCopy,
  type LandingSuggestions,
} from "./ads-copy-generator.service";
export {
  generateFacebookAdsSetup,
  buildHighConversionCampaign,
  type FacebookAdsSetup,
  type FacebookCampaignType,
  type HighConversionCampaignBundle,
  type HighConversionCampaignInput,
} from "./facebook-ads-builder.service";
export { generateGoogleKeywordCategories, type GoogleKeywordCategories, type KeywordRow } from "./google-keywords.service";
export {
  generateGoogleAdsCampaign,
  buildMontrealIntentGoogleAdsStructure,
  type GoogleAdsCampaignBundle,
  type GoogleAdsCampaignType,
  type IntentGoogleAdsStructure,
} from "./google-ads-builder.service";
export { generateLandingCopy, type LandingCopyBundle, type LandingCampaignType } from "./landing-copy.service";
export { MONTREAL_KEYWORD_BANK, MONTREAL_READY_CAMPAIGNS, type MontrealCampaignPreset } from "./montreal-ready-campaigns";
export { buildTrackedLandingUrl, type UtmParams } from "./utm-builder";
export { buildLaunchAdsStrategy, buildScalePlan, type LaunchAdsStrategy, type ScalePlanPayload } from "./ads-strategy.service";
export { listFacebookCampaignPacks, type FacebookCampaignPack, type MetaCampaignPackId } from "./facebook-campaign-packs.service";
export {
  listGoogleCampaignPacks,
  type GoogleAdsCampaignPack,
  type GoogleCampaignGroupId,
} from "./google-campaign-packs.service";
export { buildGoogleAdsManagerGuide, buildMetaAdsManagerGuide, type AdsManagerGuide } from "./ads-manager-guide.service";
export { buildLandingOptimizationPack, listLandingOptimizationPacks, type LandingOptimizationPack } from "./landing-optimization-pack.service";
export {
  getLiveCampaignDefinitions,
  getInitialBudgetPlan,
  getLiveSpendRules,
  LIVE_ADS_TRACKING_CONFIRMATION,
  type LiveCampaignDefinition,
  type LiveCampaignId,
  type InitialBudgetPlan,
  type SpendRules,
} from "./live-campaigns.service";
export { buildLiveAdsLaunchGuide, type LiveLaunchGuide } from "./live-launch-guide";
export {
  buildRetargetingAudiences,
  type RetargetingAudienceSlice,
  type RetargetingAudiences,
} from "./retargeting-audience.service";
export {
  generateRetargetingPlan,
  type RetargetingPlan,
  type RetargetingPlanItem,
} from "./ads-retargeting-strategy.service";
export {
  getAdsPerformanceSummary,
  getAdsPerformanceForWindow,
  getAdsPerformanceByCampaign,
  getFullGrowthAnalysis,
  detectWinningCampaigns,
  computeAdsPerformanceAlerts,
  DEFAULT_ADS_SCALING_THRESHOLDS,
  type AdsPerformanceSummary,
  type CampaignAdsMetrics,
  type AdsScalingThresholds,
  type WinnerLoserResult,
  type AdsPerformanceAlert,
  type GrowthFunnelEventsInput,
  type FullGrowthAnalysis,
} from "./ads-performance.service";
export { generateScalingRecommendations, type ScalingRecommendation } from "./ads-scaling-recommendations.service";
export { getRetargetingAudiences, type RetargetingAudienceSummary } from "./retargeting.service";

/** LECIPM AI Ads Autopilot V1 — generate / recommend / optimize only (no ad platform APIs). */
export {
  generateAdCopy,
  generateVideoScript,
  type AdCopyObjective,
  type AdCopyPlatform,
  type GenerateAdCopyInput,
  type GeneratedAdCopy,
  type GeneratedVideoScript,
  type VideoScriptInput,
} from "./ads-creative-ai.service";
export { generateCampaignStructure, type AiCampaignStructure } from "./ads-campaign-ai.service";
export {
  analyzePerformanceAndImprove,
  type OptimizationResult,
  type PerformanceSignals,
} from "./ads-ai-optimizer.service";
export {
  type AdsLearningSnapshot,
  type ObjectiveSegmentKey,
  getAdsLearningStore,
  recordWinningHeadline,
  recordLosingHeadline,
  recordBestAudience,
  ingestOptimizerLearning,
  recordHighPerformingHook,
  recordLowPerformingHook,
  recordWeakAudience,
  recordBestCtaPhrase,
  recordWeakCtaPhrase,
  recordBestObjectiveForSegment,
} from "./ads-learning-store";
export {
  ADS_AI_AUTOPILOT_ACTIONS,
  listAdsAiAutopilotRecommendations,
  type AdsAiAutopilotActionKey,
} from "./ads-ai-autopilot-bridge";
export {
  runAdsAutomationLoop,
  getLastAdsAutomationLoopRun,
  type AdsAutomationLoopResult,
  type AdsAutomationRecommendationRow,
} from "./ads-automation-loop.service";
export {
  ADS_AUTOMATION_LOOP_ACTIONS,
  listAdsAutomationLoopRecommendations,
  type AdsAutomationLoopActionKey,
} from "./ads-automation-loop-bridge";
export {
  classifyCampaignPerformance,
  classifyCampaignPerformanceWithEvidence,
  type ClassifiedAdsBuckets,
  type CampaignClassificationWithEvidence,
} from "./ads-learning-classifier.service";
export {
  getLearningMemoryHighlights,
  ingestClassifiedCampaigns,
  snapshotForDashboard,
  type LearningMemoryHighlights,
} from "./ads-learning-store.service";
export { generateVariantsFromWinner, type WinnerVariantBundle } from "./ads-variant-generator.service";
export { buildNextAdsTestPlan, type NextAdsTestPlan, type TestPlanEnrichedRow } from "./ads-test-plan.service";
export { analyzeLandingFeedbackLoop, type LandingOptimizationRecommendation } from "./landing-feedback-loop.service";
export {
  computeEvidenceScore,
  classifyEvidenceQuality,
  buildEvidenceBreakdown,
} from "./ads-evidence-score.service";
export {
  listAdsAutomationLoopRuns,
  getAdsAutomationLoopRunDetails,
  getAdsAutomationTrendSummary,
} from "./ads-automation-history.service";
export {
  buildOperatorExplanationCard,
  buildCampaignClassificationExplanation,
  buildLandingInsightExplanation,
} from "./ads-operator-explanation.service";
export type {
  AdsAutomationLoopRunRecord,
  PersistedRecommendation,
  PersistentLearningSnapshot,
} from "./ads-automation-v4.types";
export {
  buildWeeklyOperatorChecklist,
  WEEKLY_OPERATOR_ROUTINE,
  type WeeklyOperatorChecklist,
} from "./ads-operator-routine.service";

/** V8 non-destructive — diagnostics, anomalies, shadow budget hints, quality (read-only; no spend/attribution mutation). */
export {
  buildV8CampaignDiagnostic,
  buildV8CampaignDiagnostics,
  buildV8ShadowBidBudgetRecommendation,
  buildV8AdsNonDestructiveAlerts,
  detectV8AdsAnomalies,
  scoreV8AdsQuality,
} from "./ads-v8-non-destructive.service";
export type {
  V8AlertCandidate,
  V8AnomalySignal,
  V8CampaignDiagnostic,
  V8NonDestructiveBundle,
  V8NonDestructiveRunStats,
  V8QualityScoreResult,
  V8ShadowBidBudgetRecommendation,
} from "./ads-v8-non-destructive.types";
export { sanitizeCampaignAdsMetrics, sanitizeCampaignAdsMetricsList } from "./ads-v8-non-destructive-inputs";
export { buildV8NonDestructiveRunStats, capAnomalySignals } from "./ads-v8-non-destructive-monitoring";
export { runAdsV8NonDestructiveAnalysis } from "./ads-v8-non-destructive-bridge";
