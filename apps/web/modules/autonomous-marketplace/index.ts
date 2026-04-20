/**
 * Autonomous Marketplace module — types + engine entrypoints.
 */

export type {
  ActionType,
  AutonomyMode,
  ExecutionResult,
  GovernanceDisposition,
  GovernanceResolution,
  MarketplaceSignal,
  ObservationSnapshot,
  Opportunity,
  PolicyDecision,
  ProposedAction,
  RiskLevel,
} from "./types/public.types";

export type { ListingObservationSnapshot } from "./types/listing-observation-snapshot.types";

export type {
  ListingPreviewActionEvaluation,
  ListingPreviewOpportunityEvaluation,
  ListingPreviewResponse,
} from "./types/listing-preview.types";

export type {
  ListingPreviewSimulationCore,
  ListingPreviewResponseFlags,
  PreviewExecutionMode,
} from "./types/preview-response.types";

export type {
  ListingPreviewExplanation,
  ListingPreviewExplanationGraph,
  ListingPreviewKeyFinding,
  ListingPreviewRecommendation,
} from "./explainability/preview-explainability.types";

export { buildPreviewSignalsForListing } from "./signals/preview-signal-builder.service";
export { buildPreviewOpportunitiesFromSignals } from "./execution/preview-opportunity-builder.service";
export { evaluatePreviewPoliciesForListing } from "./policy/preview-policy-evaluator.service";
export { buildPreviewActions } from "./execution/preview-action-builder.service";
export { evaluateListingPreviewPolicyFromContext } from "./policy/policy-engine";
export { evaluateListingPreviewPolicy } from "./policy/preview-policy.service";
export {
  previewDetectorRegistry,
  runListingPreviewDetectors,
  runPreviewDetectors,
} from "./detectors/preview-detector-registry";
export { buildUnifiedListingObservation } from "./signals/listing-observation-builder.service";
export {
  buildPreviewExplanation,
  emptyListingPreviewExplanation,
} from "./explainability/preview-explainability-builder.service";

export { listingPreviewPolicyRuleEvaluators } from "./policy/listing-preview-policy-rules";

export { buildListingObservationSnapshot } from "./signals/observation-builder";

export {
  AutonomousMarketplaceEngine,
  autonomousMarketplaceEngine,
} from "./execution/autonomous-marketplace.engine";

export { resolveGovernance } from "./governance/governance-resolver";

export {
  LeadActionExecutor,
  leadActionExecutor,
  executeLeadAction,
} from "./execution/executors/lead-action.executor";
export {
  ListingActionExecutor,
  listingActionExecutor,
  executeListingAction,
} from "./execution/executors/listing-action.executor";
