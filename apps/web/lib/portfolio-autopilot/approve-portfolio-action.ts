import { prisma } from "@/lib/db";
import { getOrCreatePortfolioAutopilotSettings } from "./get-portfolio-settings";
import { executePortfolioActionDownstream } from "./apply-safe-portfolio-actions";
import { logPortfolioAutopilotEvent } from "./log-portfolio-event";

export async function approvePortfolioAction(input: {
  actionId: string;
  ownerUserId: string;
  performedByUserId: string | null;
}) {
  const action = await prisma.portfolioAutopilotAction.findFirst({
    where: { id: input.actionId, ownerUserId: input.ownerUserId },
  });
  if (!action) throw new Error("Action not found");
  if (action.status !== "suggested") {
    throw new Error("Only suggested actions can be approved");
  }

  const portfolioSettings = await getOrCreatePortfolioAutopilotSettings(input.ownerUserId);
  const result = await executePortfolioActionDownstream({
    action,
    portfolioSettings,
    performedByUserId: input.performedByUserId,
  });

  await prisma.portfolioAutopilotAction.update({
    where: { id: action.id },
    data: { status: "applied" },
  });

  await logPortfolioAutopilotEvent({
    ownerUserId: input.ownerUserId,
    actionType: "portfolio_action_approved",
    performedByUserId: input.performedByUserId,
    outputPayload: {
      actionId: action.id,
      actionType: action.actionType,
      downstream: result,
    },
  });

  return { action, result };
}
