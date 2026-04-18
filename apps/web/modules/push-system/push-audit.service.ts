import { logGrowthEngineAudit } from "@/modules/growth-engine-audit/growth-engine-audit.service";

export async function auditBrokerPushEvent(input: {
  actorUserId: string;
  action: "push_register" | "push_preferences" | "push_dispatched" | "push_inbox_read";
  payload?: Record<string, unknown>;
}): Promise<void> {
  await logGrowthEngineAudit({
    actorUserId: input.actorUserId,
    action: `broker_mobile_push:${input.action}`,
    payload: input.payload,
  });
}
