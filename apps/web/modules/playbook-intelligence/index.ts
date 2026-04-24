export type {
  CrossDomainIntelligenceResult,
  CrossDomainCandidate,
  CrossDomainRecommendationResult,
  SharedContextRepresentation,
  TransferEligibilityResult,
} from "./shared/shared-context.types";
export { normalizeSharedContext, toSharedContextRepresentation } from "./shared/shared-context-normalize";
export { buildSharedSignature, extractSharedFeatureTokens } from "./shared/shared-context-signature";
export { computeSharedFeatureFit, computeJsonFeatureFit } from "./utils/playbook-shared-score";
export {
  computeCrossDomainCompatibility,
  computeTransferPenalty,
  computeCrossDomainRecommendationScore,
} from "./utils/playbook-transfer-score";
export { playbookSharedContextService } from "./services/playbook-shared-context.service";
export { evaluateTransferEligibility } from "./services/playbook-transfer-governor.service";
export { playbookCrossDomainRetrievalService } from "./services/playbook-cross-domain-retrieval.service";
export { playbookIntelligenceOrchestratorService } from "./services/playbook-intelligence-orchestrator.service";
