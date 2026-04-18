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

export { evaluateListingPreviewPolicy } from "./policy/policy-engine";
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
