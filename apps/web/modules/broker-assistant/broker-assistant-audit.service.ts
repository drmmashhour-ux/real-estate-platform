import { recordAuditEvent } from "@/modules/analytics/audit-log.service";

export type BrokerAssistantAuditAction =
  | "broker-assistant:context_built"
  | "broker-assistant:missing_info_detected"
  | "broker-assistant:compliance_flag_raised"
  | "broker-assistant:drafting_suggestion_generated"
  | "broker-assistant:clause_suggestion_generated"
  | "broker-assistant:translation_generated"
  | "broker-assistant:broker_approved_output"
  | "broker-assistant:broker_rejected_output";

export async function recordBrokerAssistantAudit(input: {
  actorUserId: string;
  action: BrokerAssistantAuditAction;
  payload?: Record<string, unknown>;
}): Promise<void> {
  await recordAuditEvent({
    actorUserId: input.actorUserId,
    action: input.action,
    payload: { scope: "[broker-assistant]", ...input.payload },
  });
}
