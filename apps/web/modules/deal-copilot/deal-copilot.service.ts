import { prisma } from "@/lib/db";
import { runDealCopilotEngine } from "./deal-copilot.engine";

export async function loadCopilotSuggestions(dealId: string) {
  return prisma.dealCopilotSuggestion.findMany({
    where: { dealId },
    orderBy: { createdAt: "desc" },
    take: 100,
  });
}

export async function runCopilotForDealId(dealId: string, actorUserId: string) {
  const deal = await prisma.deal.findUniqueOrThrow({ where: { id: dealId } });
  return runDealCopilotEngine(deal, actorUserId);
}
