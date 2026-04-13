import { prisma } from "@/lib/db";
import { logRevenueAutopilotEvent } from "./log-revenue-event";

export async function rejectRevenueAction(input: {
  actionId: string;
  scopeType: "owner" | "platform";
  scopeId: string;
  performedByUserId: string | null;
}) {
  const action = await prisma.revenueAutopilotAction.findFirst({
    where: {
      id: input.actionId,
      scopeType: input.scopeType,
      scopeId: input.scopeId,
    },
  });
  if (!action) throw new Error("Action not found");
  if (action.status !== "suggested") throw new Error("Only suggested actions can be rejected");

  await prisma.revenueAutopilotAction.update({
    where: { id: action.id },
    data: { status: "rejected" },
  });

  await logRevenueAutopilotEvent({
    scopeType: input.scopeType,
    scopeId: input.scopeId,
    actionType: "action_rejected",
    performedByUserId: input.performedByUserId,
    hostId: input.scopeType === "owner" ? input.scopeId : null,
    outputPayload: { actionId: action.id, actionType: action.actionType },
  });

  return { action };
}
