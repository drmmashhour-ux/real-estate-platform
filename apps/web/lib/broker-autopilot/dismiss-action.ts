import { prisma } from "@/lib/db";
import { findAutopilotActionForBroker } from "@/lib/broker-autopilot/access";
import { trackBrokerAutopilot } from "@/lib/broker-autopilot/analytics";

export async function dismissAutopilotAction(actionId: string, brokerUserId: string, isAdmin: boolean) {
  const action = await findAutopilotActionForBroker(actionId, brokerUserId, isAdmin);
  if (!action) throw new Error("Not found");
  if (action.status === "executed" || action.status === "dismissed") {
    throw new Error("Already finalized");
  }

  const now = new Date();
  const updated = await prisma.lecipmBrokerAutopilotAction.update({
    where: { id: actionId },
    data: { status: "dismissed", dismissedAt: now },
  });

  trackBrokerAutopilot("broker_autopilot_action_dismissed", { actionId, leadId: action.leadId }, { userId: brokerUserId });
  return updated;
}
