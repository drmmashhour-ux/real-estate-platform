import { recordAuditEvent } from "@/modules/analytics/audit-log.service";
import type { ExecutionAuditEvent } from "./execution.types";

export async function recordExecutionAudit(input: {
  actorUserId: string | null;
  event: ExecutionAuditEvent;
  payload?: Record<string, unknown>;
}): Promise<void> {
  await recordAuditEvent({
    actorUserId: input.actorUserId,
    action: `execution:${input.event}`,
    payload: input.payload,
  });
}
