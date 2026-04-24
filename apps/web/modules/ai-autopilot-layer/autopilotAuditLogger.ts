import { prisma } from "@/lib/db";
import type { Prisma } from "@prisma/client";

export type AutopilotAuditEventKey =
  | "autopilot_config_updated"
  | "autopilot_plan_generated"
  | "autopilot_action_proposed"
  | "autopilot_action_approved"
  | "autopilot_action_rejected"
  | "autopilot_action_executed"
  | "autopilot_action_blocked"
  | "autopilot_guard_failed";

export async function logAutopilotEvent(input: {
  userId?: string | null;
  actionId?: string | null;
  eventKey: AutopilotAuditEventKey;
  payload?: Record<string, unknown>;
}) {
  await prisma.aiAutopilotLayerEvent.create({
    data: {
      userId: input.userId ?? undefined,
      actionId: input.actionId ?? undefined,
      eventKey: input.eventKey,
      payloadJson: (input.payload ?? {}) as Prisma.InputJsonValue,
    },
  });
}
