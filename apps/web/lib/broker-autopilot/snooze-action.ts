import { prisma } from "@/lib/db";
import { findAutopilotActionForBroker } from "@/lib/broker-autopilot/access";

export async function snoozeAutopilotAction(
  actionId: string,
  brokerUserId: string,
  isAdmin: boolean,
  until: Date
) {
  const action = await findAutopilotActionForBroker(actionId, brokerUserId, isAdmin);
  if (!action) throw new Error("Not found");
  if (action.status === "executed" || action.status === "dismissed") {
    throw new Error("Cannot snooze this action");
  }

  return prisma.lecipmBrokerAutopilotAction.update({
    where: { id: actionId },
    data: { snoozedUntil: until },
  });
}
