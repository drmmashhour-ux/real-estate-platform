/**
 * TrustGraph Autopilot — public module surface.
 * Implementation: `lib/trustgraph/` (clean architecture: domain / application / infrastructure).
 */
export { trustScoringService } from "@/lib/trustgraph/infrastructure/services/trustScoringService";
export {
  collectNextBestActionsFromRuleResults,
  flattenSignalsFromRuleResults,
} from "@/lib/trustgraph/application/generateNextBestActions";
export type { RuleEvaluationResult, FsboListingRuleContext } from "@/lib/trustgraph/domain/types";
export type { TrustGraphRule } from "@/lib/trustgraph/domain/contracts";
export * from "@/lib/trustgraph/domain/enums";
export { runVerificationPipelineForCase } from "@/lib/trustgraph/application/runVerificationPipeline";
export { runListingVerification } from "@/lib/trustgraph/application/runListingVerification";
export { runSellerDeclarationVerification } from "@/lib/trustgraph/application/runSellerDeclarationVerification";
export { runBrokerVerification } from "@/lib/trustgraph/application/runBrokerVerification";
export { findOrCreateActiveVerificationCase } from "@/lib/trustgraph/application/findOrCreateVerificationCase";
export { toListingTrustSnapshotDto } from "@/lib/trustgraph/application/dto/listingTrustSnapshotDto";
export { assertListingPublishTrustGate } from "@/lib/trustgraph/application/integrations/listingPublishIntegration";
export {
  computeSellerDeclarationReadinessFromListing,
  refreshListingTrustGraphOnSave,
} from "@/lib/trustgraph/application/integrations/sellerDeclarationIntegration";
export {
  getBrokerTrustBadgeSafeDto,
  syncBrokerTrustGraphForUser,
} from "@/lib/trustgraph/application/integrations/brokerProfileIntegration";
