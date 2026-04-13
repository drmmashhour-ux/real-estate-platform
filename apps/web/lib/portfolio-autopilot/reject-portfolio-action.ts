import { prisma } from "@/lib/db";
import { logPortfolioAutopilotEvent } from "./log-portfolio-event";

export async function rejectPortfolioAction(input: {
  actionId: string;
  ownerUserId: string;
  performedByUserId: string | null;
}) {
  const action = await prisma.portfolioAutopilotAction.findFirst({
    where: { id: input.actionId, ownerUserId: input.ownerUserId },
  });
  if (!action) throw new Error("Action not found");
  if (action.status !== "suggested") {
    throw new Error("Only suggested actions can be rejected");
  }

  await prisma.portfolioAutopilotAction.update({
    where: { id: action.id },
    data: { status: "rejected" },
  });

  await logPortfolioAutopilotEvent({
    ownerUserId: input.ownerUserId,
    actionType: "portfolio_action_rejected",
    performedByUserId: input.performedByUserId,
    outputPayload: { actionId: action.id, actionType: action.actionType },
  });

  return { action };
}
