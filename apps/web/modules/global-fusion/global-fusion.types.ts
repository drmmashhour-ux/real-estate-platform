/**
 * Global Fusion V1 — read-only advisory types (Brain + Ads + CRO + Ranking).
 * Does not replace source-system semantics.
 */

export type GlobalFusionSource = "brain" | "ads" | "cro" | "ranking";

export type GlobalFusionTargetType = "subsystem" | "theme" | "entity_hint";

export type GlobalFusionRecommendationKind =
  | "prioritize_growth"
  | "prioritize_stability"
  | "fix_funnel_first"
  | "expand_ranking_cautiously"
  | "monitor_only"
  | "defer_until_evidence"
  | "require_human_review";

export type GlobalFusionConflictRecommendation =
  | "proceed"
  | "proceed_with_caution"
  | "monitor_only"
  | "defer"
  | "require_human_review";

export type GlobalFusionConflictSeverity = "low" | "medium" | "high";

export type GlobalFusionNormalizedSignal = {
  id: string;
  source: GlobalFusionSource;
  targetType: GlobalFusionTargetType;
  targetId: string;
  confidence: number | null;
  priority: number | null;
  risk: number | null;
  evidenceQuality: number | null;
  recommendationType: string | null;
  reason: string[];
  blockers: string[];
  metrics: Record<string, number | string | boolean | null>;
  timestamp: string;
  freshnessMs: number | null;
  provenance: string;
};

export type GlobalFusionConflict = {
  id: string;
  systems: GlobalFusionSource[];
  severity: GlobalFusionConflictSeverity;
  summary: string;
  recommendation: GlobalFusionConflictRecommendation;
  detail: string;
};

/** Optional presentation-layer fields (Phase B influence — additive, never written to source systems). */
export type GlobalFusionPresentationFields = {
  /** 0–1 presentation priority after influence (higher = earlier in UI). */
  displayPriority?: number;
  /** Stable sort key within tier. */
  displayOrder?: number;
  /** Advisory tags only — e.g. boost, caution, monitor_only, low_evidence, require_human_review */
  influenceTags?: string[];
};

export type GlobalFusionOpportunity = {
  id: string;
  title: string;
  systems: GlobalFusionSource[];
  confidence: number;
  rationale: string;
} & GlobalFusionPresentationFields;

export type GlobalFusionRisk = {
  id: string;
  title: string;
  systems: GlobalFusionSource[];
  severity: GlobalFusionConflictSeverity;
  rationale: string;
} & GlobalFusionPresentationFields;

export type GlobalFusionRecommendation = {
  /** Stable key for presentation overlay (assigned when recommendations are built). */
  id?: string;
  kind: GlobalFusionRecommendationKind;
  title: string;
  why: string;
  systemsAgreed: GlobalFusionSource[];
  systemsDisagreed: GlobalFusionSource[];
  confidenceSummary: string;
  riskSummary: string;
  evidenceSummary: string;
} & GlobalFusionPresentationFields;

export type GlobalFusionScore = {
  fusedConfidence: number;
  fusedPriority: number;
  fusedRisk: number;
  actionability: number;
  agreementScore: number;
  evidenceScore: number;
};

export type GlobalFusionHealthSummary = {
  overallStatus: "ok" | "degraded" | "limited";
  observationalWarnings: string[];
  insufficientEvidenceCount: number;
  missingSourceCount: number;
};

export type GlobalFusionInfluenceReason = {
  code: string;
  detail: string;
};

export type GlobalFusionInfluenceAdjustment = {
  targetKind: "opportunity" | "risk" | "recommendation";
  targetId: string;
  /** Bounded presentation delta (−0.15 … +0.15) on internal score. */
  deltaPriority: number;
  tagsAdded: string[];
  reason: string;
};

export type GlobalFusionInfluenceGateSummary = {
  passed: boolean;
  applyOrdering: boolean;
  /** Quality tier for influence path selection. */
  tier: "strong" | "weak" | "blocked";
  reasons: string[];
  missingSourcesOk: boolean;
  malformedRateOk: boolean;
  evidenceOk: boolean;
  disagreementOk: boolean;
};

export type GlobalFusionInfluenceMetrics = {
  influencedCount: number;
  boostedCount: number;
  cautionCount: number;
  deferredCount: number;
  monitorCount: number;
  humanReviewCount: number;
};

export type GlobalFusionInfluenceResult = {
  applied: boolean;
  skipped: boolean;
  gate: GlobalFusionInfluenceGateSummary;
  reasons: GlobalFusionInfluenceReason[];
  adjustments: GlobalFusionInfluenceAdjustment[];
  metrics: GlobalFusionInfluenceMetrics;
  /** Observational safety warnings (non-blocking). */
  observationalWarnings: string[];
  /** Compact list of influenced overlay targets (presentation only). */
  influencedItems?: Array<{ kind: "opportunity" | "risk" | "recommendation"; id: string }>;
};

export type GlobalFusionInfluenceOverlay = {
  result: GlobalFusionInfluenceResult;
};

export type GlobalFusionSnapshot = {
  generatedAt: string;
  opportunities: GlobalFusionOpportunity[];
  risks: GlobalFusionRisk[];
  recommendations: GlobalFusionRecommendation[];
  conflicts: GlobalFusionConflict[];
  scores: GlobalFusionScore;
  signals: GlobalFusionNormalizedSignal[];
  /** Phase B: populated when influence flag on; presentation copies may include tags/order. */
  influence: GlobalFusionInfluenceResult | null;
};

/** Phase C — routing label for advisory composition (presentation only). */
export type GlobalFusionPrimaryPathLabel =
  | "source_advisory_default"
  | "global_fusion_primary"
  | "global_fusion_primary_fallback_default";

export type GlobalFusionPrimaryFallbackReason =
  | "fusion_disabled"
  | "primary_flag_off"
  | "malformed_signals"
  | "insufficient_coverage"
  | "scores_invalid"
  | "unexpected_empty_advisory"
  | "missing_sources_excess"
  | "influence_contradictory_output"
  | "assembly_error";

export type GlobalFusionPrimaryBucket =
  | "proceed"
  | "proceed_with_caution"
  | "monitor_only"
  | "defer"
  | "blocked"
  | "require_human_review"
  | "insufficient_evidence";

export type GlobalFusionPrimaryGroupedBuckets = {
  proceed: GlobalFusionPrimarySurfaceItem[];
  proceed_with_caution: GlobalFusionPrimarySurfaceItem[];
  monitor_only: GlobalFusionPrimarySurfaceItem[];
  defer: GlobalFusionPrimarySurfaceItem[];
  blocked: GlobalFusionPrimarySurfaceItem[];
  require_human_review: GlobalFusionPrimarySurfaceItem[];
  insufficient_evidence: GlobalFusionPrimarySurfaceItem[];
};

export type GlobalFusionPrimarySurfaceItem = {
  kind: "opportunity" | "risk" | "recommendation";
  id: string;
  systems: GlobalFusionSource[];
  title: string;
  summary: string;
  confidenceSummary?: string;
  riskSummary?: string;
  evidenceSummary?: string;
  rationale?: string;
  blockers?: string[];
  tags: string[];
  provenanceSystems: GlobalFusionSource[];
};

export type GlobalFusionPrimarySurfaceMeta = {
  systemsUsed: string[];
  agreementScore: number;
  conflictCount: number;
  evidenceQuality: number;
  missingSources: string[];
  fallbackUsed: boolean;
  fallbackReason?: GlobalFusionPrimaryFallbackReason;
  path: GlobalFusionPrimaryPathLabel;
};

export type GlobalFusionPrimarySurface = {
  generatedAt: string;
  opportunitiesRanked: GlobalFusionOpportunity[];
  risksRanked: GlobalFusionRisk[];
  recommendationsRanked: GlobalFusionRecommendation[];
  groupedBy: GlobalFusionPrimaryGroupedBuckets;
  meta: GlobalFusionPrimarySurfaceMeta;
};

export type GlobalFusionPrimaryValidationResult = {
  ok: boolean;
  reasons: string[];
};

export type GlobalFusionPrimarySurfaceResult = {
  path: GlobalFusionPrimaryPathLabel;
  /** True when PRIMARY_V1 is on, fusion is enabled, and validation passed. */
  primarySurfaceActive: boolean;
  surface: GlobalFusionPrimarySurface | null;
  /** Single fusion assembly (Phase B influence applied at most once inside `buildGlobalFusionPayload`). */
  fusionPayload: GlobalFusionPayload;
  validation: GlobalFusionPrimaryValidationResult;
  /** Observational safety hints (non-blocking). */
  observationalWarnings: string[];
};

export type GlobalFusionPayload = {
  enabled: boolean;
  snapshot: GlobalFusionSnapshot | null;
  health: GlobalFusionHealthSummary;
  meta: {
    dataFreshnessMs: number;
    sourcesUsed: string[];
    missingSources: string[];
    contributingSystemsCount: number;
    normalizedSignalCount: number;
    conflictCount: number;
    recommendationCount: number;
    persistenceLogged: boolean;
    influenceFlag: boolean;
    primaryFlag: boolean;
    /** True when Phase B influence overlay ran and applied presentation changes. */
    influenceApplied: boolean;
    /** Count of malformed normalizer warnings (Phase C validation). */
    malformedNormalizedCount: number;
  };
};

/** Phase E — Fusion-local learning (does not alter source-system stores). */
export type GlobalFusionLearningFeedbackSource =
  | GlobalFusionSource
  | "operator"
  | "platform_core"
  | "manual"
  | "synthetic_proxy";

export type GlobalFusionLearningSignal = {
  signalId: string;
  sourceSystems: GlobalFusionSource[];
  targetType: GlobalFusionTargetType;
  targetId: string;
  recommendationType: string | null;
  fusedConfidence?: number;
  fusedPriority?: number;
  fusedRisk?: number;
  evidenceScore?: number;
  agreementScore?: number;
  emittedAt: string;
};

export type GlobalFusionLearningOutcomeType =
  | "proxy_success"
  | "proxy_failure"
  | "neutral"
  | "unknown"
  | "insufficient_linkage";

export type GlobalFusionLearningOutcome = {
  signalId: string;
  observedAt: string;
  outcomeType: GlobalFusionLearningOutcomeType;
  outcomeValue?: number;
  success: boolean | null;
  notes?: string;
  source?: GlobalFusionLearningFeedbackSource;
  linkageStrength: "strong" | "weak" | "unavailable";
};

export type GlobalFusionLearningWeight = {
  source: GlobalFusionSource;
  value: number;
  defaultValue: number;
};

export type GlobalFusionLearningAdjustment = {
  source: GlobalFusionSource;
  delta: number;
  reason: string;
  blocked: boolean;
  blockedReason?: string;
};

export type GlobalFusionLearningDecisionQuality = {
  recommendationHitRate: number | null;
  falsePositiveRate: number | null;
  falseNegativeRate: number | null;
  confidenceCalibration: number | null;
  riskCalibration: number | null;
};

export type GlobalFusionLearningSummary = {
  runs: number;
  signalsEvaluated: number;
  outcomesLinked: number;
  accuracyEstimate: number | null;
  recommendationHitRate: number | null;
  falsePositiveRate: number | null;
  falseNegativeRate: number | null;
  weightAdjustments: GlobalFusionLearningAdjustment[];
  warnings: string[];
  skipped: boolean;
  skipReason?: string;
};

export type GlobalFusionLearningSnapshot = {
  generatedAt: string;
  summary: GlobalFusionLearningSummary;
  signals: GlobalFusionLearningSignal[];
  outcomes: GlobalFusionLearningOutcome[];
};

export type GlobalFusionLearningRun = {
  runId: string;
  startedAt: string;
  completedAt: string;
  summary: GlobalFusionLearningSummary;
};

/** Phase F — Fusion-local governance (advisory; does not change source systems). */
export type GlobalFusionGovernanceDecision =
  | "healthy"
  | "watch"
  | "caution"
  | "freeze_learning_recommended"
  | "freeze_learning_applied"
  | "rollback_recommended"
  | "require_human_review";

export type GlobalFusionGovernanceWarning = {
  code: string;
  detail: string;
};

export type GlobalFusionGovernanceThresholdState = {
  fallbackBreached: boolean;
  missingSourceBreached: boolean;
  conflictBreached: boolean;
  disagreementBreached: boolean;
  lowEvidenceBreached: boolean;
  anomalyBreached: boolean;
  unstableOrderingBreached: boolean;
  weightDriftBreached: boolean;
  learningQualityBreached: boolean;
  malformedBreached: boolean;
};

export type GlobalFusionGovernanceMetrics = {
  fallbackRate: number;
  missingSourceRate: number;
  conflictRate: number;
  disagreementRate: number;
  lowEvidenceRate: number;
  influenceAppliedRate: number | null;
  anomalyRate: number;
  learningAccuracy: number | null;
  calibrationQuality: number | null;
  weightDrift: number;
};

export type GlobalFusionRollbackSignal = {
  level: "watch" | "caution" | "rollback_recommended" | "require_human_review";
  summary: string;
  contributingFactors: string[];
  emittedAt: string;
  /** Present when FEATURE_GLOBAL_FUSION_AUTO_ROLLBACK_SIGNAL_V1 is on (structured advisory only). */
  formal: boolean;
};

export type GlobalFusionFreezeDecision = {
  learningFreezeRecommended: boolean;
  influenceFreezeRecommended: boolean;
  learningFreezeApplied: boolean;
  influenceFreezeApplied: boolean;
  reason: string;
};

export type GlobalFusionGovernanceInput = {
  monitoringRunsTotal: number;
  metrics: GlobalFusionGovernanceMetrics;
  thresholdState: GlobalFusionGovernanceThresholdState;
  consecutiveStrongBreaches: number;
  learningSummary: GlobalFusionLearningSummary | null;
};

export type GlobalFusionGovernanceStatus = {
  decision: GlobalFusionGovernanceDecision;
  recommendation: string;
  warnings: GlobalFusionGovernanceWarning[];
  rollbackSignal?: GlobalFusionRollbackSignal;
  freezeDecision?: GlobalFusionFreezeDecision;
  metrics: GlobalFusionGovernanceMetrics;
  thresholdState: GlobalFusionGovernanceThresholdState;
  reasons: string[];
  notes: string[];
};

export type GlobalFusionGovernanceSnapshot = {
  evaluatedAt: string;
  status: GlobalFusionGovernanceStatus;
  governanceEnabled: boolean;
  autoFreezeEnabled: boolean;
  autoRollbackSignalEnabled: boolean;
};

/** Phase G — Executive operating layer (read-only coordination; does not replace source truth). */
export type GlobalFusionExecutiveThemeId =
  | "growth_acceleration"
  | "stability_first"
  | "launch_readiness"
  | "governance_attention"
  | "evidence_gap"
  | "operational_blocker"
  | "ranking_expansion_candidate"
  | "funnel_first"
  | "human_review_required"
  | "neutral";

export type GlobalFusionExecutiveTheme = {
  id: GlobalFusionExecutiveThemeId;
  label: string;
  /** Relative signal strength 0–1 from fused heuristics (observational). */
  signalStrength: number;
  supportingPriorityIds: string[];
};

export type GlobalFusionExecutivePriority = {
  id: string;
  theme: GlobalFusionExecutiveThemeId;
  importance: "low" | "medium" | "high";
  title: string;
  summary: string;
  sourceSystems: GlobalFusionSource[];
  supportingSignals: string[];
  blockers: string[];
  risks: string[];
  confidence: number | null;
  evidenceSummary: string;
};

/** Executive-layer risk line (distinct from `GlobalFusionRisk` snapshot rows). */
export type GlobalFusionExecutiveRisk = {
  id: string;
  severity: "low" | "medium" | "high";
  title: string;
  summary: string;
  sourceSystems: GlobalFusionSource[];
  reasons: string[];
  attentionAreas: string[];
  freshnessMs: number | null;
};

export type GlobalFusionExecutiveOpportunity = {
  id: string;
  title: string;
  summary: string;
  sourceSystems: GlobalFusionSource[];
  confidence: number | null;
  rationale: string;
};

export type GlobalFusionExecutiveBlocker = {
  id: string;
  title: string;
  summary: string;
  sourceSystems: GlobalFusionSource[];
  dependencies: string[];
};

export type GlobalFusionExecutiveReadiness = {
  label: "strong" | "moderate" | "limited" | "at_risk";
  summary: string;
  /** Factors that reduced readiness (observational). */
  factors: string[];
};

export type GlobalFusionExecutiveRolloutSummary = {
  pathLabel: GlobalFusionPrimaryPathLabel | "unknown";
  primaryActive: boolean;
  fallbackRate: number;
  missingSourceRate: number;
  conflictRate: number;
  governanceDecision: GlobalFusionGovernanceDecision | null;
};

export type GlobalFusionExecutiveHealthSummary = {
  overallStatus: GlobalFusionHealthSummary["overallStatus"];
  observationalWarnings: string[];
  insufficientEvidenceCount: number;
  missingSourceCount: number;
  fusedAgreementApprox: number | null;
};

export type GlobalFusionExecutiveProvenance = {
  generatedAt: string;
  fusionV1Enabled: boolean;
  executiveLayerEnabled: boolean;
  contributingSystemsCount: number;
  normalizedSignalCount: number;
  sourcesUsed: string[];
};

export type GlobalFusionExecutiveNarrativeBlock = {
  id: string;
  headline: string;
  body: string;
  relatedThemes: GlobalFusionExecutiveThemeId[];
};

export type GlobalFusionExecutiveSummary = {
  overallStatus: "healthy" | "watch" | "caution" | "degraded";
  companyReadiness: GlobalFusionExecutiveReadiness;
  topPriorities: GlobalFusionExecutivePriority[];
  topRisks: GlobalFusionExecutiveRisk[];
  topOpportunities: GlobalFusionExecutiveOpportunity[];
  topBlockers: GlobalFusionExecutiveBlocker[];
  themes: GlobalFusionExecutiveTheme[];
  rolloutSummary: GlobalFusionExecutiveRolloutSummary;
  healthSummary: GlobalFusionExecutiveHealthSummary;
  notes: string[];
  narrativeBlocks: GlobalFusionExecutiveNarrativeBlock[];
  provenance: GlobalFusionExecutiveProvenance;
  /** True when FEATURE_GLOBAL_FUSION_EXECUTIVE_LAYER_V1 is off or inputs were empty. */
  disabled?: boolean;
  disabledReason?: string;
};

export type GlobalFusionExecutiveDelta = {
  sinceGeneratedAt: string | null;
  prioritiesDelta: number;
  risksDelta: number;
  overallStatusChanged: boolean;
};

export type GlobalFusionExecutiveSnapshot = {
  generatedAt: string;
  summary: GlobalFusionExecutiveSummary;
  deltaHint: GlobalFusionExecutiveDelta | null;
};

export type GlobalFusionExecutiveFeedMeta = {
  feedVersion: 1;
  generatedAt: string;
  executiveLayerEnabled: boolean;
  executiveFeedEnabled: boolean;
  executivePersistenceEnabled: boolean;
  missingSourceDegraded: boolean;
  weakEvidenceOnly: boolean;
};

export type GlobalFusionExecutiveFeed = {
  summary: GlobalFusionExecutiveSummary;
  topPriorities: GlobalFusionExecutivePriority[];
  topRisks: GlobalFusionExecutiveRisk[];
  topOpportunities: GlobalFusionExecutiveOpportunity[];
  rolloutSummary: GlobalFusionExecutiveRolloutSummary;
  healthSummary: GlobalFusionExecutiveHealthSummary;
  warnings: string[];
  provenance: GlobalFusionExecutiveProvenance;
  meta: GlobalFusionExecutiveFeedMeta;
};

/** Narrow monitoring slice for executive assembly (avoids circular imports). */
export type GlobalFusionExecutiveMonitoringInput = {
  runsTotal: number;
  fallbackRate: number;
  missingSourceRate: number;
  conflictRate: number;
  disagreementRate: number;
  lowEvidenceRate: number;
  anomalyRate: number;
  unstableOrderingRate: number;
  malformedInputRate: number;
};

/** Bundled read-only inputs for executive assembly (tests and internal use). */
export type GlobalFusionExecutiveAssemblyInput = {
  fusionPayload: GlobalFusionPayload;
  primaryResult: GlobalFusionPrimarySurfaceResult | null;
  monitoring: GlobalFusionExecutiveMonitoringInput;
  governanceSnapshot: GlobalFusionGovernanceSnapshot | null;
  learningSummary: GlobalFusionLearningSummary | null;
  /** Learning health slice; null when learning flag off. */
  learning: {
    learningRuns: number;
    weightDriftL1: number;
    insufficientLinkageRate: number;
  } | null;
  freezeState: {
    learningFrozen: boolean;
    influenceFrozen: boolean;
    reason: string | null;
    frozenAt: string | null;
  };
};

/** Phase H — Company operating protocol (advisory coordination; no execution binding). */
export type GlobalFusionProtocolTargetSystem =
  | "swarm"
  | "growth_loop"
  | "operator"
  | "platform_core"
  | "command_center";

export type GlobalFusionProtocolSignalType = "priority" | "risk" | "opportunity" | "blocker" | "alignment";

export type GlobalFusionProtocolSignal = {
  id: string;
  type: GlobalFusionProtocolSignalType;
  targetSystems: GlobalFusionProtocolTargetSystem[];
  priorityLevel: "low" | "medium" | "high";
  confidence: number | null;
  riskLevel: "low" | "medium" | "high" | null;
  recommendationType: string | null;
  reasons: string[];
  sourceSystems: GlobalFusionSource[];
  timestamp: string;
};

export type GlobalFusionProtocolPriority = {
  id: string;
  title: string;
  summary: string;
  targetSystems: GlobalFusionProtocolTargetSystem[];
  importance: "low" | "medium" | "high";
  executiveTheme?: GlobalFusionExecutiveThemeId;
};

export type GlobalFusionProtocolDirectiveType =
  | "coordinate_review"
  | "defer_expansion"
  | "stabilize_funnel"
  | "governance_sync"
  | "evidence_gathering"
  | "alignment_check";

export type GlobalFusionProtocolDirective = {
  id: string;
  directiveType: GlobalFusionProtocolDirectiveType;
  targetSystems: GlobalFusionProtocolTargetSystem[];
  summary: string;
  priority: "low" | "medium" | "high";
  constraints?: string[];
  notes?: string[];
  provenance: { source: string; generatedAt: string };
};

export type GlobalFusionProtocolAlignment = {
  id: string;
  theme: string;
  supportedSystems: GlobalFusionProtocolTargetSystem[];
  strength: number;
  rationale: string;
};

/** Protocol-level coordination tension (distinct from `GlobalFusionConflict`). */
export type GlobalFusionProtocolConflict = {
  id: string;
  description: string;
  systemsInvolved: GlobalFusionProtocolTargetSystem[];
  fusionSources: GlobalFusionSource[];
  suggestedAttention: string;
  severity: "low" | "medium" | "high";
};

export type GlobalFusionOperatingProtocol = {
  generatedAt: string;
  active: boolean;
  inactiveReason?: string;
  priorities: GlobalFusionProtocolPriority[];
  risks: GlobalFusionProtocolSignal[];
  opportunities: GlobalFusionProtocolSignal[];
  blockers: GlobalFusionProtocolSignal[];
  directives: GlobalFusionProtocolDirective[];
  alignment: GlobalFusionProtocolAlignment[];
  conflicts: GlobalFusionProtocolConflict[];
  signals: GlobalFusionProtocolSignal[];
  meta: {
    protocolVersion: 1;
    contributingSystemsCount: number;
    executiveSummaryUsed: boolean;
    governanceDecision: GlobalFusionGovernanceDecision | null;
    notes: string[];
  };
};

export type GlobalFusionProtocolSnapshot = {
  generatedAt: string;
  protocol: GlobalFusionOperatingProtocol;
};

export type GlobalFusionProtocolSwarmPayload = {
  version: 1;
  objectives: string[];
  coordinationSignals: GlobalFusionProtocolSignal[];
  conflictWarnings: string[];
  notes: string[];
};

export type GlobalFusionProtocolGrowthLoopPayload = {
  version: 1;
  growthPriorities: string[];
  funnelFocus: string | null;
  scalingVsOptimizationHint: string | null;
  signals: GlobalFusionProtocolSignal[];
  notes: string[];
};

export type GlobalFusionProtocolOperatorPayload = {
  version: 1;
  readinessHints: string[];
  dependencyBlockers: string[];
  resourceConstraints: string[];
  signals: GlobalFusionProtocolSignal[];
  notes: string[];
};

export type GlobalFusionProtocolPlatformCorePayload = {
  version: 1;
  healthPriorities: string[];
  governanceAttention: string[];
  technicalRiskSignals: GlobalFusionProtocolSignal[];
  notes: string[];
};

export type GlobalFusionProtocolCommandCenterPayload = {
  version: 1;
  headline: string;
  groupedPriorities: GlobalFusionProtocolPriority[];
  groupedRisks: GlobalFusionProtocolSignal[];
  presentationNotes: string[];
};

export type GlobalFusionProtocolPerSystem = {
  swarm: GlobalFusionProtocolSwarmPayload;
  growth_loop: GlobalFusionProtocolGrowthLoopPayload;
  operator: GlobalFusionProtocolOperatorPayload;
  platform_core: GlobalFusionProtocolPlatformCorePayload;
  command_center: GlobalFusionProtocolCommandCenterPayload;
};

export type GlobalFusionProtocolFeed = {
  protocol: GlobalFusionOperatingProtocol;
  perSystem: GlobalFusionProtocolPerSystem;
  meta: {
    feedVersion: 1;
    generatedAt: string;
    protocolEnabled: boolean;
    protocolFeedEnabled: boolean;
    protocolMonitoringEnabled: boolean;
    warnings: string[];
  };
};
