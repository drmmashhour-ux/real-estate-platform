import { prisma } from "@/lib/db";
import { executeRevenueActionDownstream } from "./apply-safe-revenue-actions";
import { getOrCreateRevenueAutopilotSettings } from "./get-revenue-settings";
import { logRevenueAutopilotEvent } from "./log-revenue-event";

export async function approveRevenueAction(input: {
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
  if (action.status !== "suggested") throw new Error("Only suggested actions can be approved");

  const settings = await getOrCreateRevenueAutopilotSettings(input.scopeType, input.scopeId);
  const ownerForRuns = input.scopeType === "owner" ? input.scopeId : null;

  const result = await executeRevenueActionDownstream({
    action,
    settings,
    performedByUserId: input.performedByUserId,
    ownerUserIdForListingRuns: ownerForRuns,
  });

  await prisma.revenueAutopilotAction.update({
    where: { id: action.id },
    data: { status: "applied" },
  });

  await logRevenueAutopilotEvent({
    scopeType: input.scopeType,
    scopeId: input.scopeId,
    actionType: "action_approved",
    performedByUserId: input.performedByUserId,
    hostId: ownerForRuns,
    outputPayload: { actionId: action.id, actionType: action.actionType, result },
  });

  return { action, result };
}
