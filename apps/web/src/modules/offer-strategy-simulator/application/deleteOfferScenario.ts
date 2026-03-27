import { prisma } from "@/lib/db";

export async function deleteOfferScenario(args: { userId: string; scenarioId: string; propertyId: string }) {
  const row = await prisma.offerStrategyScenario.findFirst({
    where: { id: args.scenarioId, userId: args.userId, propertyId: args.propertyId },
  });
  if (!row) return { ok: false as const, error: "Scenario not found." };
  await prisma.offerStrategyScenario.delete({ where: { id: args.scenarioId } });
  return { ok: true as const };
}
