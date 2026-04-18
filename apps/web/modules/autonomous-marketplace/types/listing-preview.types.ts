import type { ListingObservationSnapshot } from "./listing-observation-snapshot.types";
import type {
  AutonomyMode,
  ExecutionResult,
  ObservationSnapshot,
  Opportunity,
  PolicyDecision,
  ProposedAction,
  RiskLevel,
} from "./domain.types";
import type { RegionListingRef } from "@/modules/integrations/regions/region-listing-key.types";
import type { SyriaOpportunity, SyriaSignal } from "@/modules/integrations/regions/syria/syria-signal.types";
import type { SyriaPreviewPolicyDecision } from "@/modules/integrations/regions/syria/syria-policy.service";

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
};
