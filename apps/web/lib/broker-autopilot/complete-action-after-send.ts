import { prisma } from "@/lib/db";
import { findAutopilotActionForBroker } from "@/lib/broker-autopilot/access";
import { trackBrokerAutopilot } from "@/lib/broker-autopilot/analytics";

export async function markAutopilotActionExecutedAfterSend(input: {
  actionId: string;
  leadId: string;
  brokerUserId: string;
  isAdmin: boolean;
}) {
  const { actionId, leadId, brokerUserId, isAdmin } = input;
  const action = await findAutopilotActionForBroker(actionId, brokerUserId, isAdmin);
  if (!action || action.leadId !== leadId) return { ok: false as const };

  await prisma.lecipmBrokerAutopilotAction.update({
    where: { id: actionId },
    data: { status: "executed", dismissedAt: null },
  });

  trackBrokerAutopilot(
    "broker_autopilot_followup_draft_sent",
    { actionId, leadId: action.leadId },
    { userId: brokerUserId }
  );
  return { ok: true as const };
}
