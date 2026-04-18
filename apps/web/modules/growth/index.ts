export { GrowthEventName, type GrowthEventNameType, isGrowthEventName } from "./event-types";
/** Client `trackEvent` + canonical names — posts to `/api/analytics/track` + `growth_events` (allowlisted). */
export { trackEvent, GrowthTrackEvent } from "./track-event";
export {
  recordGrowthEvent,
  appendGrowthEventFromClientIngest,
  trackGrowthSystemEvent,
  logGrowthAutonomousOptimizerRun,
  GROWTH_SERVER_ONLY_EVENTS,
  GROWTH_CLIENT_ALLOWED_EVENTS,
  trafficEventTypeToGrowthName,
  mergeCroRetargetingRootsIntoClientMeta,
  type RecordGrowthEventParams,
} from "./tracking.service";
export type { CroTrackingMeta, RetargetingTrackingMeta } from "./tracking-metadata.types";
export {
  formatConvRate,
  resolveLearnedListSourceLabel,
  safeSumBookingsFromPerfRows,
} from "./growth-retargeting-ui-helpers";
export {
  ingestUnifiedSignal,
  buildUnifiedSnapshot,
  computeUnifiedAutopilotConfidence,
  computeEvidenceForUnified,
  maybeIngestUnifiedFromGrowthMetadata,
  type UnifiedLearningSnapshot,
  type UnifiedSignalSource,
  type UnifiedSignalType,
  type IngestUnifiedSignalInput,
} from "./unified-learning.service";
export {
  updatePerformance,
  mergePerformanceDelta,
  bumpRetargetingBooking,
  getTopMessagesBySegment,
  getWeakMessages,
  snapshotAll,
  type RetargetingPerformance,
} from "./retargeting-performance.service";
export {
  analyzeBookingFunnel,
  type BookingFunnelAnalysis,
  type CroEngineHintIssue,
  type FunnelDropOffStage,
} from "./booking-funnel-analysis.service";
export {
  listRetargetingAutopilotRecommendations,
  RETARGETING_AUTOPILOT_ACTIONS,
  type RetargetingAutopilotActionKey,
} from "./retargeting-autopilot-bridge";
export {
  ADS_AI_AUTOPILOT_ACTIONS,
  listAdsAiAutopilotRecommendations,
  type AdsAiAutopilotActionKey,
} from "@/modules/ads/ads-ai-autopilot-bridge";
export {
  ADS_AUTOMATION_LOOP_ACTIONS,
  listAdsAutomationLoopRecommendations,
  type AdsAutomationLoopActionKey,
} from "@/modules/ads/ads-automation-loop-bridge";
export {
  listAdsAutomationLoopRuns,
  getAdsAutomationLoopRunDetails,
  getAdsAutomationTrendSummary,
} from "@/modules/ads/ads-automation-history.service";
export type {
  AiAutopilotAction,
  AiAutopilotActionStatus,
  AiAutopilotActionWithStatus,
} from "./ai-autopilot.types";
export {
  buildGrowthUnifiedSnapshot,
  analyzeGrowth,
  generateGrowthActions,
  buildAutopilotActions,
  buildAutopilotBundle,
  buildAutopilotBundleFromSnapshot,
  computePriorityScore,
  resolveSnapshotSignal,
  applyIntelligenceLayer,
  type AutopilotActionsBundle,
} from "./ai-autopilot.service";
export type { AutopilotPanelPayload } from "./ai-autopilot-api.helpers";
export {
  fetchEarlyConversionAdsSnapshot,
  fetchEarlyConversionYesterdayStats,
  computePaidFunnelAdsInsights,
  computeAdsPerformanceHealth,
} from "./growth-ai-analyzer.service";
export { buildPaidFunnelAutopilotActions } from "./growth-ai-actions.service";
export {
  recordLandingView,
  recordFormStart,
  recordFormSubmit,
  getConversionSnapshot,
} from "./simple-conversion-tracker";
export { approveAction, rejectAction, getAutopilotActionStatus } from "./ai-autopilot-approval.service";
export { executeApprovedActions } from "./ai-autopilot-execution.service";
export { executeApprovedSafeActions } from "./ai-autopilot-controlled-execution.service";
export { rollbackExecutedSafeAction } from "./ai-autopilot-rollback.service";
export {
  allowedActionTypes,
  isSafeExecutableAutopilotAction,
  maxActionsPerRun,
} from "./ai-autopilot-execution-policy";
export { getAutopilotMonitoringSnapshot, resetAutopilotMonitoringForTests } from "./ai-autopilot-execution-monitoring.service";
