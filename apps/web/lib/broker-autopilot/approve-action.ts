import { prisma } from "@/lib/db";
import { findAutopilotActionForBroker } from "@/lib/broker-autopilot/access";
import { trackBrokerAutopilot } from "@/lib/broker-autopilot/analytics";

export async function approveAutopilotAction(actionId: string, brokerUserId: string, isAdmin: boolean) {
  const action = await findAutopilotActionForBroker(actionId, brokerUserId, isAdmin);
  if (!action) throw new Error("Not found");
  if (action.status !== "suggested") {
    throw new Error("Only suggested actions can be approved");
  }

  const updated = await prisma.lecipmBrokerAutopilotAction.update({
    where: { id: actionId },
    data: { status: "approved" },
  });

  trackBrokerAutopilot("broker_autopilot_action_approved", { actionId, leadId: action.leadId }, { userId: brokerUserId });
  return updated;
}
