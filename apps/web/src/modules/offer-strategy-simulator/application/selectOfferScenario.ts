import { prisma } from "@/lib/db";
import { toSavedScenarioDto } from "@/src/modules/offer-strategy-simulator/infrastructure/offerScenarioSavedMapper";

export async function selectOfferScenario(args: {
  userId: string;
  scenarioId: string;
  propertyId: string;
  caseId: string | null;
}) {
  const existing = await prisma.offerStrategyScenario.findFirst({
    where: {
      id: args.scenarioId,
      userId: args.userId,
      propertyId: args.propertyId,
      caseId: args.caseId,
    },
  });
  if (!existing) return { ok: false as const, error: "Scenario not found." };

  await prisma.$transaction([
    prisma.offerStrategyScenario.updateMany({
      where: {
        propertyId: args.propertyId,
        userId: args.userId,
        caseId: args.caseId,
      },
      data: { selected: false },
    }),
    prisma.offerStrategyScenario.update({
      where: { id: args.scenarioId },
      data: { selected: true },
    }),
  ]);

  const updated = await prisma.offerStrategyScenario.findUniqueOrThrow({ where: { id: args.scenarioId } });
  return { ok: true as const, scenario: toSavedScenarioDto(updated) };
}
