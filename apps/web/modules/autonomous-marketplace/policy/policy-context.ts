import type { LegalHubSummary } from "@/modules/legal/legal.types";
import type { LegalReadinessScore } from "@/modules/legal/legal-readiness.types";
import type {
  GrowthOpportunity,
  GrowthSignal,
  GrowthSnapshot,
  GrowthPriorityScore,
} from "@/modules/growth-intelligence/growth.types";
import type { TrustBadge, TrustScore, TrustVisibilityImpact } from "@/modules/trust/trust.types";
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
  /** Legal Hub summary — populated when Legal Hub V1 loads user context (see policy-context-builder). */
  legalSummary?: LegalHubSummary | null;
  legalReadinessScore?: LegalReadinessScore | null;
  trustScore?: TrustScore | null;
  trustBadges?: TrustBadge[] | null;
  visibilityImpact?: TrustVisibilityImpact | null;
  /** Growth Intelligence Phase 6 — populated only when explicitly attached (feature-flagged). */
  growthSnapshot?: GrowthSnapshot | null;
  /** Timeline-derived signals (subset of `growthSignals` when attached). */
  growthTimelineSignals?: GrowthSignal[] | null;
  growthSignals?: GrowthSignal[] | null;
  growthOpportunities?: GrowthOpportunity[] | null;
  topGrowthPrioritySummary?: GrowthPriorityScore[] | null;
  /** Québec deterministic checklist preview for policy preview / governance (Phase — feature-flagged). */
  quebecCompliance?: {
    readinessScore: number;
    allowed: boolean;
    blockingIssueIds: string[];
    reasonsPreview: string[];
  } | null;
  /** Phase 8 — property legal risk snapshot when evaluator loads (deterministic index). */
  propertyLegalRisk?: {
    score: number;
    level: string;
    blocking: boolean;
  } | null;
};
