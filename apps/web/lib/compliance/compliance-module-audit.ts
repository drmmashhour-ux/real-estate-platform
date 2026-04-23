import { recordAuditEvent } from "@/modules/analytics/audit-log.service";

export async function logComplianceModuleAudit(input: {
  actorUserId?: string | null;
  action: string;
  payload?: Record<string, unknown>;
}): Promise<void> {
  await recordAuditEvent({
    actorUserId: input.actorUserId,
    action: `lecipm_compliance:${input.action}`,
    payload: input.payload,
  });
}
