import { prisma } from "@/lib/db";

export async function listSuggestions(dealId: string) {
  return prisma.negotiationSuggestion.findMany({
    where: { dealId },
    orderBy: { createdAt: "desc" },
  });
}

export async function getActiveThread(dealId: string) {
  return prisma.negotiationThread.findFirst({
    where: { dealId, status: "active" },
    orderBy: { createdAt: "desc" },
    include: { rounds: { include: { proposals: true }, orderBy: { roundNumber: "desc" } } },
  });
}
