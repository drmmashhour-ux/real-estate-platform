/**
 * Fusion System V1 — additive advisory types. Does not replace Brain, Ads, Operator, or Platform Core.
 */

export type FusionSignalSource = "brain" | "ads" | "operator" | "platform_core";

/** Comparable cross-system signal (read-only projection). */
export type FusionNormalizedSignal = {
  id: string;
  source: FusionSignalSource;
  kind: string;
  entityRef?: { type: string; id?: string | null };
  confidence?: number;
  trust?: number;
  priority?: number;
  risk?: number;
  evidenceQuality?: number;
  reasons: string[];
  advisoryActionType?: string;
  freshnessAt?: string;
  /** Opaque provenance pointer (e.g. decision id, recommendation id). */
  provenanceId?: string;
  metadata?: Record<string, unknown>;
};

export type FusionScore = {
  fusedConfidence: number;
  fusedPriority: number;
  fusedRisk: number;
  fusedReadiness: number;
  agreementScore: number;
  evidenceQuality: number;
  actionabilityScore: number;
};

export type FusionConflictSeverity = "low" | "medium" | "high";

export type FusionConflictRecommendation = "monitor" | "caution" | "defer" | "proceed";

export type FusionConflict = {
  id: string;
  systems: FusionSignalSource[];
  severity: FusionConflictSeverity;
  category: string;
  reason: string;
  recommendation: FusionConflictRecommendation;
  entityRef?: { type: string; id?: string | null };
};

export type FusionAdvisoryKind =
  | "proceed"
  | "proceed_with_caution"
  | "monitor_only"
  | "defer"
  | "blocked_by_dependency"
  | "insufficient_evidence";

export type FusionRecommendation = {
  kind: FusionAdvisoryKind;
  title: string;
  detail: string;
  agreeingSystems: FusionSignalSource[];
  disagreeingSystems: FusionSignalSource[];
  keyRisks: string[];
  supportingEvidenceNote?: string;
};

export type FusionComparisonSummary = {
  overlapEntityCount: number;
  divergentPriorityCount: number;
  notes: string[];
};

export type FusionInfluenceOverlay = {
  /** Presentation hints only — never execution or stored truth. */
  rankingNudges: Array<{ targetKey: string; delta: number; reason: string }>;
  tagsByTarget: Record<string, string[]>;
};

export type FusionHealthSummary = {
  subsystemsAvailable: number;
  subsystemsTotal: number;
  normalizedSignalCount: number;
  agreementPairsApprox: number;
  disagreementPairsApprox: number;
  conflictCount: number;
  conflictByCategory: Record<string, number>;
  recommendationsByKind: Record<FusionAdvisoryKind, number>;
  insufficientEvidenceRate: number;
  observationalWarnings: string[];
};

export type FusionSnapshot = {
  generatedAt: string;
  scores: FusionScore;
  signals: FusionNormalizedSignal[];
  conflicts: FusionConflict[];
  recommendations: FusionRecommendation[];
  comparisonSummary: FusionComparisonSummary;
  health: FusionHealthSummary;
  influenceOverlay: FusionInfluenceOverlay | null;
  persistenceId?: string | null;
};

/** Phase C — primary advisory surface (presentation-only; not source-of-truth). */
export type FusionPrimaryBuckets = Record<FusionAdvisoryKind, FusionRecommendation[]>;

/** Primary-surface item with explicit provenance (advisory; not execution). */
export type FusionPrimaryAdvisoryItem = {
  kind: FusionAdvisoryKind;
  title: string;
  detail: string;
  /** Contributing subsystems for this line (union of agreement + tension sides). */
  sourceSystems: FusionSignalSource[];
  reasons: string[];
  /** Bounded 0–1 — fused evidence/confidence blend for this row. */
  confidence: number;
  /** Bounded 0–1 — fused risk with light per-row weighting. */
  risk: number;
  agreeingSystems: FusionSignalSource[];
  disagreeingSystems: FusionSignalSource[];
  keyRisks: string[];
};

/** Short bucket keys for top-level advisory consumers (maps from {@link FusionAdvisoryKind}). */
export type FusionPrimaryGroupedByShort = {
  proceed: FusionPrimaryAdvisoryItem[];
  caution: FusionPrimaryAdvisoryItem[];
  monitor: FusionPrimaryAdvisoryItem[];
  defer: FusionPrimaryAdvisoryItem[];
  blocked: FusionPrimaryAdvisoryItem[];
  insufficient: FusionPrimaryAdvisoryItem[];
};

export type FusionPrimarySurfaceMeta = {
  agreementScore: number;
  conflictCount: number;
  systemsUsed: FusionSignalSource[];
  evidenceQuality: number;
};

/** Stable contract: ranked recs + grouped buckets + fused meta. */
export type FusionPrimaryStructuredSurface = {
  recommendations: FusionPrimaryAdvisoryItem[];
  groupedBy: FusionPrimaryGroupedByShort;
  meta: FusionPrimarySurfaceMeta;
};

export type FusionPrimaryPresentation = {
  rankedRecommendations: FusionRecommendation[];
  buckets: FusionPrimaryBuckets;
  contributingSystems: FusionSignalSource[];
  agreementScore: number;
  riskReadinessSummary: string;
  /** Explicit reminder — advisory fusion layer only. */
  provenanceNote: string;
  /** Canonical primary shape for ranking/presentation layers. */
  structured: FusionPrimaryStructuredSurface;
};

export type FusionPrimaryObservabilityPayload = {
  primaryFlagOn: boolean;
  primaryPresentationActive: boolean;
  fusedItemCount: number;
  contributingSystemsCount: number;
  fallbackCountSession: number;
  fallbackReason?: string;
  bucketCounts: Record<FusionAdvisoryKind, number>;
  conflictCount: number;
  insufficientEvidenceRate: number;
  sourceCoverageSummary: string;
};

export type FusionPrimarySurfaceResult = {
  /** True when FEATURE_FUSION_SYSTEM_PRIMARY_V1 is on (requested primary mode). */
  primaryModeRequested: boolean;
  /** True when validation passed and a primary presentation was built. */
  primaryPresentationActive: boolean;
  /** Full snapshot — same as Phase A/B; source systems remain inspectable here. */
  snapshot: FusionSnapshot | null;
  /** Grouped/ranked view when primary path succeeded; null when fallback or flag off. */
  presentation: FusionPrimaryPresentation | null;
  fallbackUsed: boolean;
  fallbackReason?: string;
  observationalWarnings: string[];
  observability: FusionPrimaryObservabilityPayload;
};
