/**
 * Preview response envelope — read-only DRY_RUN simulation types.
 * Domain models come from public.types / domain.types (no duplicates).
 */

import type { ListingObservationSnapshot } from "./listing-observation-snapshot.types";
import type {
  ExecutionResult,
  MarketplaceSignal,
  ObservationSnapshot,
  Opportunity,
  PolicyDecision,
  ProposedAction,
} from "./domain.types";
import type { ListingPreviewExplanation } from "../explainability/preview-explainability.types";

/** Preview simulation only ever runs as DRY_RUN — executors are never invoked from this path. */
export type PreviewExecutionMode = "DRY_RUN";

export type ListingPreviewResponseFlags = {
  realPreviewEnabled: boolean;
  explainabilityEnabled: boolean;
};

/**
 * Canonical preview simulation payload — always read-only; execution mode is DRY_RUN only.
 */
export type ListingPreviewSimulationCore = {
  listingId: string;
  metrics: ListingObservationSnapshot | null;
  observation: ObservationSnapshot;
  signals: MarketplaceSignal[];
  opportunities: Opportunity[];
  proposedActions: ProposedAction[];
  policyDecisions: PolicyDecision[];
  executionResult: ExecutionResult;
  previewExplanation: ListingPreviewExplanation;
  flags: ListingPreviewResponseFlags;
};
