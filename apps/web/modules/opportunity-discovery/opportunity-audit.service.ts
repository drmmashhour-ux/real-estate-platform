import { recordAuditEvent } from "@/modules/analytics/audit-log.service";

export type OpportunityAiAuditEvent =
  | "opportunity_discovered"
  | "opportunity_reviewed"
  | "opportunity_dismissed"
  | "opportunity_actioned"
  | "outcome_recorded";

export async function recordOpportunityAiAudit(input: {
  actorUserId: string | null;
  event: OpportunityAiAuditEvent;
  payload?: Record<string, unknown>;
}): Promise<void> {
  await recordAuditEvent({
    actorUserId: input.actorUserId,
    action: `opportunity-ai:${input.event}`,
    payload: input.payload,
  });
}
