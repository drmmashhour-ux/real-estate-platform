import { prisma } from "@/lib/db";
import { toSavedScenarioDto } from "@/src/modules/offer-strategy-simulator/infrastructure/offerScenarioSavedMapper";

export async function getOfferScenarioHistory(args: {
  userId: string;
  propertyId: string;
  /** When set (e.g. Case Command Center document id), only rows for that case. */
  caseId: string | null;
}) {
  const rows = await prisma.offerStrategyScenario.findMany({
    where: {
      propertyId: args.propertyId,
      userId: args.userId,
      ...(args.caseId != null ? { caseId: args.caseId } : {}),
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });
  return rows.map(toSavedScenarioDto);
}
