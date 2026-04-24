import { recordAuditEvent } from "@/modules/analytics/audit-log.service";

export type CompanyAiAuditAction =
  | "outcome_window_generated"
  | "pattern_detected"
  | "adaptation_proposed"
  | "adaptation_approved"
  | "adaptation_rejected"
  | "playbook_memory_updated"
  | "report_generated";

export async function logCompanyAiAudit(input: {
  action: CompanyAiAuditAction;
  payload: Record<string, unknown>;
  actorUserId?: string | null;
}): Promise<void> {
  await recordAuditEvent({
    action: `company_ai:${input.action}`,
    payload: input.payload,
    actorUserId: input.actorUserId,
  });
}
