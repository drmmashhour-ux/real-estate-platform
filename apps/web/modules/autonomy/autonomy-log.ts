import { logInfo } from "@/lib/logger";

const P = "[autonomy]";

export const autonomyLog = {
  candidatesBuilt: (n: number, meta?: Record<string, unknown>) =>
    logInfo(`${P} candidates_built`, { count: n, ...meta }),
  policyEvaluated: (meta: Record<string, unknown>) => logInfo(`${P} policy_evaluated`, meta),
  actionRouted: (meta: Record<string, unknown>) => logInfo(`${P} action_routed`, meta),
  actionBlocked: (meta: Record<string, unknown>) => logInfo(`${P} action_blocked`, meta),
  actionQueued: (meta: Record<string, unknown>) => logInfo(`${P} action_queued`, meta),
  actionExecuted: (meta: Record<string, unknown>) => logInfo(`${P} action_executed`, meta),
  approvalRecorded: (meta: Record<string, unknown>) => logInfo(`${P} approval_recorded`, meta),
  runCompleted: (meta: Record<string, unknown>) => logInfo(`${P} autonomy_run_completed`, meta),
  policyUpdated: (meta: Record<string, unknown>) => logInfo(`${P} policy_updated`, meta),
  emergencyFreeze: (meta: Record<string, unknown>) => logInfo(`${P} emergency_freeze_applied`, meta),
};
