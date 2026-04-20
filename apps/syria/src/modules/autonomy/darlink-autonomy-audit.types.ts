/** Audit / timeline event names — deterministic strings for logs + DB. */
export const DarlinkAutonomyAuditEvent = {
  RUN_STARTED: "autonomy_run_started",
  SIGNAL_DETECTED: "autonomy_signal_detected",
  OPPORTUNITY_CREATED: "autonomy_opportunity_created",
  ACTION_BLOCKED: "autonomy_action_blocked",
  ACTION_PENDING_APPROVAL: "autonomy_action_pending_approval",
  ACTION_EXECUTED: "autonomy_action_executed",
  ACTION_FAILED: "autonomy_action_failed",
  ACTION_ROLLED_BACK: "autonomy_action_rolled_back",
  FEEDBACK_RECORDED: "autonomy_feedback_recorded",
} as const;
