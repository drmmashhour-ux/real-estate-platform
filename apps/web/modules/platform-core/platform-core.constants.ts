/** Audit event types — stable strings for filtering and dashboards. */
export const PLATFORM_CORE_AUDIT = {
  DECISION_REGISTERED: "platform_core.decision.registered",
  DECISION_STATUS: "platform_core.decision.status_changed",
  DECISION_APPROVED: "platform_core.decision.approved",
  DECISION_DISMISSED: "platform_core.decision.dismissed",
  DECISION_BLOCKED: "platform_core.decision.blocked",
  DECISION_EXECUTED: "platform_core.decision.executed",
  DECISION_FAILED: "platform_core.decision.failed",
  DECISION_ROLLBACK: "platform_core.decision.rollback",
  TASK_QUEUED: "platform_core.task.queued",
  TASK_STATUS: "platform_core.task.status_changed",
  /** Operator V2 — external budget sync (simulation / execution / guardrail blocks); no spend without approval + flags. */
  OPERATOR_V2_BUDGET_SYNC_SIMULATED: "platform_core.operator_v2.budget_sync.simulated",
  OPERATOR_V2_BUDGET_SYNC_EXECUTED: "platform_core.operator_v2.budget_sync.executed",
  OPERATOR_V2_BUDGET_SYNC_BLOCKED: "platform_core.operator_v2.budget_sync.blocked",
  OPERATOR_V2_BUDGET_SYNC_FAILED: "platform_core.operator_v2.budget_sync.failed",
  /** One Brain V2 — outcome rows persisted (ingestion). */
  BRAIN_V2_OUTCOME_RECORDED: "platform_core.brain_v2.outcome.recorded",
  /** One Brain V2 — source weights updated from observed outcomes (manual / admin). */
  BRAIN_V2_WEIGHTS_ADAPTED: "platform_core.brain_v2.weights.adapted",
  /** One Brain V2 — learning batch completed. */
  BRAIN_V2_LEARNING_RUN: "platform_core.brain_v2.learning.run",
  /** Platform Core V2 — priority computed and stored. */
  PRIORITY_COMPUTED: "platform_core.orchestration.priority_computed",
  /** Platform Core V2 — cross-decision conflict detected. */
  DECISION_CONFLICT: "platform_core.orchestration.conflict",
  /** Platform Core V2 — scheduled re-evaluation due or processed. */
  SCHEDULER_REEVAL: "platform_core.orchestration.scheduler_reeval",
  /** Platform Core V2 — dependencies registered. */
  DEPENDENCIES_REGISTERED: "platform_core.orchestration.dependencies_registered",
  /** Brain V8 — shadow observation pass (read-only analysis; does not mutate outcomes). */
  BRAIN_SHADOW_V8_OBSERVATION: "platform_core.brain_v8.shadow.observation",
  /** Ranking V8 — parallel shadow score evaluation vs live (does not change sort order). */
  RANKING_SHADOW_V8_EVALUATION: "platform_core.ranking_v8.shadow.evaluation",
} as const;

/** Internal task kinds — no external vendor calls. */
export const PLATFORM_CORE_TASK_TYPE = {
  MARK_CAMPAIGN_SCALE_READY: "internal.mark_campaign_scale_ready",
  MARK_CAMPAIGN_PAUSE_READY: "internal.mark_campaign_pause_ready",
  PRIORITIZE_CTA: "internal.prioritize_cta_variant",
  PRIORITIZE_RETARGETING_MESSAGE: "internal.prioritize_retargeting_message",
  PROMOTE_EXPERIMENT_SAFE: "internal.promote_experiment_winner_safe",
  FLAG_LISTING_IMPROVE: "internal.flag_listing_improvement",
  BOOST_INTERNAL_SCORE: "internal.boost_listing_internal_score",
  DOWNRANK_INTERNAL_SCORE: "internal.downrank_listing_internal_score",
} as const;
