import { recordAuditEvent } from "@/modules/analytics/audit-log.service";

export async function logAppraisalAdjustmentAudit(input: {
  actorUserId?: string | null;
  action: string;
  entityId?: string | null;
  payload?: Record<string, unknown>;
}): Promise<void> {
  await recordAuditEvent({
    actorUserId: input.actorUserId,
    action: `appraisal_adjustment:${input.action}`,
    payload: {
      entityId: input.entityId,
      ...input.payload,
    },
  });
}
