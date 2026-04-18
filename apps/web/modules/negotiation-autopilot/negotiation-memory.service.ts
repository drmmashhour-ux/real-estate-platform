import { prisma } from "@/lib/db";

export async function getNegotiationContext(dealId: string) {
  const [threads, suggestions] = await Promise.all([
    prisma.negotiationThread.findMany({ where: { dealId }, take: 5, orderBy: { updatedAt: "desc" } }),
    prisma.negotiationSuggestion.findMany({ where: { dealId }, take: 20, orderBy: { createdAt: "desc" } }),
  ]);
  return { threads, suggestions };
}
