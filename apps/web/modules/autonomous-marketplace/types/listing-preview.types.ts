import type { ListingObservationSnapshot } from "./listing-observation-snapshot.types";
import type {
  AutonomyMode,
  ExecutionResult,
  MarketplaceSignal,
  ObservationSnapshot,
  Opportunity,
  PolicyDecision,
  ProposedAction,
  RiskLevel,
} from "./domain.types";
import type { RegionListingRef } from "@/modules/integrations/regions/region-listing-key.types";
import type { SyriaOpportunity, SyriaSignal } from "@/modules/integrations/regions/syria/syria-signal.types";
import type { SyriaPreviewPolicyDecision } from "@/modules/integrations/regions/syria/syria-policy.types";
import type { SyriaApprovalBoundaryResult } from "@/modules/integrations/regions/syria/syria-approval-boundary.types";
import type { SyriaPreviewPolicyDecisionEnvelope } from "@/modules/integrations/regions/syria/syria-governance-review.types";
import type { ListingExplanation } from "../explainability/explainability.types";
import type { ListingPreviewExplanation } from "../explainability/preview-explainability.types";
import type { ListingPreviewResponseFlags } from "./preview-response.types";
import type { ListingQuebecCompliancePreview } from "@/modules/legal/compliance/quebec-compliance.types";
import type {
  PropertyLegalRiskScore,
  PropertyPublishComplianceSummary,
} from "@/modules/legal/scoring/property-legal-risk.types";
import type { LegalTrustRankingImpact } from "@/modules/trust-ranking/legal-trust-ranking.types";

/** One proposed action with its policy outcome (evaluate-only). */
export type ListingPreviewActionEvaluation = {
  proposedAction: ProposedAction;
  policy: PolicyDecision;
};

/** Links Opportunity → proposed actions → PolicyDecision (same order as `opportunities`). */
export type ListingPreviewOpportunityEvaluation = {
  opportunityId: string;
  detectorId: string;
  title: string;
  actions: ListingPreviewActionEvaluation[];
};

/** Region-aware preview input — backward compatible with bare `listingId` string at the engine API. */
export type PreviewListingInput = {
  listingId: string;
  /** Omit or `web` → FSBO / legacy web listing preview path. */
  source?: "web" | "syria" | "external";
  regionCode?: string;
  dryRun?: boolean;
};

export type ListingPreviewExplainability = {
  summary: string;
  notes: readonly string[];
};

/**
 * Preview payload — read-only listing metrics, no actions, no execution.
 */
export type ListingPreviewResponse = {
  listingId: string;
  autonomyMode: AutonomyMode;
  /** Read-only DB snapshot; null if listing id not found. */
  metrics: ListingObservationSnapshot | null;
  /** Convenience alias of `observation.signals` for API consumers. */
  signals: MarketplaceSignal[];
  observation: ObservationSnapshot;
  opportunities: Opportunity[];
  proposedActions: ProposedAction[];
  /** Flattened policies — same order as `proposedActions`. */
  policyDecisions: PolicyDecision[];
  /** Nested trace: Opportunity → ProposedAction → PolicyDecision. */
  opportunityEvaluations: ListingPreviewOpportunityEvaluation[];
  executionResult: ExecutionResult;
  /** Deterministic zeros for preview. */
  riskBuckets: Record<RiskLevel, number>;
  /** Populated when `FEATURE_REGION_LISTING_KEY_V1` is on and source is resolved. */
  regionListingRef?: RegionListingRef | null;
  previewNotes?: string[];
  capabilityNotes?: string[];
  executionUnavailableForSyria?: boolean;
  /** Syria policy + governance lane (reviewType); modeled only — no execution. */
  syriaPolicyDecision?: SyriaPreviewPolicyDecisionEnvelope;
  /** Syria-specific preview note lines (subset of advisory context). */
  syriaPreviewNotes?: readonly string[];
  /** Deterministic governance / trust lines for operators. */
  syriaGovernanceExplainability?: readonly string[];
  explainability?: ListingPreviewExplainability;
  /** Syria-only: detector-style signals derived from observation facts (read-only). */
  syriaSignals?: SyriaSignal[];
  syriaOpportunities?: SyriaOpportunity[];
  /** Short explanation lines aligned with Syria signals. */
  syriaSignalExplainability?: readonly string[];
  /** Advisory policy outcome from Syria signal severities — not FSBO/Québec policy. */
  syriaPolicyPreview?: {
    decision: SyriaPreviewPolicyDecision;
    rationale: string;
  };
  /** Read-only / execution boundary for Syria (no live automation in default web posture). */
  syriaApprovalBoundary?: SyriaApprovalBoundaryResult;
  /** Phase 6.5 deterministic reasoning graph — preview/dry-run only (`FEATURE_AUTONOMY_EXPLAINABILITY_V1`). */
  explanation?: ListingExplanation | null;
  /** Deterministic preview graph + findings (`FEATURE_AUTONOMY_PREVIEW_EXPLAINABILITY_V1` + real preview pipeline). */
  previewExplanation?: ListingPreviewExplanation | null;
  /** Feature gates for preview simulation surfaces. */
  flags?: ListingPreviewResponseFlags;
  /** Non-technical one-liner for safe surfaces — no graph or rule codes. */
  userSafeReasoningSummary?: string | null;
  /** Deterministic Québec compliance snapshot (read-only; FEATURE_QUEBEC_COMPLIANCE_V1). */
  quebecCompliancePreview?: ListingQuebecCompliancePreview | null;
  /** Phase 8 — publish readiness + legal risk envelope (read-only). */
  propertyPublishCompliance?: PropertyPublishComplianceSummary | null;
  propertyLegalRisk?: PropertyLegalRiskScore | null;
  legalTrustRanking?: LegalTrustRankingImpact | null;
};
