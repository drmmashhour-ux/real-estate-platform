/**
 * Coordination telemetry — console only; never throws.
 */

const PREFIX = "[growth:team-coordination]";

export async function recordAssignmentEvent(payload: {
  kind: "assign_role" | "assign_user" | "acknowledge" | "status";
  taskId: string;
  role?: string;
  status?: string;
}): Promise<void> {
  try {
    // eslint-disable-next-line no-console -- internal ops observability
    console.info(`${PREFIX} ${payload.kind} taskId=${payload.taskId}`, payload.role ?? "", payload.status ?? "");
  } catch {
    /* swallow */
  }
}

export async function recordCoordinationSummaryBuilt(summary: {
  totalTasks: number;
  blockedCount: number;
}): Promise<void> {
  try {
    // eslint-disable-next-line no-console -- internal ops observability
    console.info(
      `${PREFIX} summary total=${summary.totalTasks} blocked=${summary.blockedCount}`,
    );
  } catch {
    /* swallow */
  }
}
