import type { LegalIntelligenceSummary } from "@/modules/legal/legal-intelligence.types";
import type { LegalIntelligenceSignal } from "@/modules/legal/legal-intelligence.types";
import type { LegalReviewPriorityScore } from "@/modules/legal/legal-intelligence.types";
import type { AutonomyMode } from "../types/domain.types";
import type { ObservationSnapshot } from "../types/domain.types";
import type { ProposedAction } from "../types/domain.types";

export type PolicyContext = {
  action: ProposedAction;
  observation: ObservationSnapshot;
  autonomyMode: AutonomyMode;
  /** Listing published / active */
  targetActive: boolean;
  activePromotionCount: number;
  priceDeltaTodayPct: number;
  lastOutreachHours?: number;
  followUpAttempts?: number;
  /** Optional legal intelligence — populated when feature flags + target allow (see policy-context-builder). */
  legalIntelligenceSummary?: LegalIntelligenceSummary | null;
  topLegalIntelligenceSignals?: LegalIntelligenceSignal[];
  legalReviewPriorityScore?: LegalReviewPriorityScore | null;
};
