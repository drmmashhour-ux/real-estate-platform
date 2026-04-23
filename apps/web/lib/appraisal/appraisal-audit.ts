import { recordAuditEvent } from "@/modules/analytics/audit-log.service";

export type AppraisalAuditAction =
  | "appraisal_case_created"
  | "comparable_added"
  | "adjustment_added"
  | "value_computed"
  | "report_created"
  | "report_reviewed"
  | "report_finalized";

export async function logAppraisalAudit(input: {
  actorUserId?: string | null;
  action: AppraisalAuditAction;
  entityId?: string | null;
  summary?: string;
  payload?: Record<string, unknown>;
}): Promise<void> {
  await recordAuditEvent({
    actorUserId: input.actorUserId,
    action: `lecipm_appraisal:${input.action}`,
    payload: {
      entityId: input.entityId,
      summary: input.summary,
      ...input.payload,
    },
  });
}
