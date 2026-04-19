/**
 * Execution planner telemetry — console only; never throws; no side effects beyond logs.
 */

const PREFIX = "[growth:execution-planner]";

export type ExecutionPlanStats = {
  todayCount: number;
  weeklyCount: number;
  blockedCount: number;
};

export async function recordExecutionPlanGenerated(stats: ExecutionPlanStats): Promise<void> {
  try {
    // eslint-disable-next-line no-console -- growth ops observability
    console.info(
      `${PREFIX} plan_generated today=${stats.todayCount} weekly=${stats.weeklyCount} blocked=${stats.blockedCount}`,
    );
  } catch {
    /* swallow */
  }
}

export async function recordTaskApprovalDecision(payload: {
  taskId: string;
  decision: "approved" | "denied";
  reason?: string;
}): Promise<void> {
  try {
    // eslint-disable-next-line no-console -- growth ops observability
    console.info(`${PREFIX} approval taskId=${payload.taskId} decision=${payload.decision}`, payload.reason ?? "");
  } catch {
    /* swallow */
  }
}

export async function recordTaskOpened(taskId: string): Promise<void> {
  try {
    // eslint-disable-next-line no-console -- growth ops observability
    console.info(`${PREFIX} surface_open taskId=${taskId}`);
  } catch {
    /* swallow */
  }
}

/** @deprecated Prefer server-side approval logging — kept for gradual UI migration */
export async function recordLocalTaskApproval(taskId: string): Promise<void> {
  await recordTaskApprovalDecision({ taskId, decision: "approved" });
}
