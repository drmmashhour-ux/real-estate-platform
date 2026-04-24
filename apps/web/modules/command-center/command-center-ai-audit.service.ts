import { recordAuditEvent } from "@/modules/analytics/audit-log.service";

export type CommandCenterAuditEvent =
  | "snapshot_generated"
  | "alert_created"
  | "recommendation_generated"
  | "recommendation_actioned"
  | "quick_action_used";

export async function recordCommandCenterAudit(input: {
  actorUserId: string;
  event: CommandCenterAuditEvent;
  payload?: Record<string, unknown>;
}): Promise<void> {
  await recordAuditEvent({
    actorUserId: input.actorUserId,
    action: `command-center:${input.event}`,
    payload: input.payload,
  });
}
