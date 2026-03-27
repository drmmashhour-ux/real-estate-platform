import { prisma } from "@/lib/db";
import { isDealAnalyzerOfferAssistantEnabled } from "@/modules/deal-analyzer/config";
import { mapOfferStrategyRow } from "@/modules/deal-analyzer/infrastructure/mappers/phase3DtoMappers";

export async function getOfferStrategyDto(listingId: string) {
  if (!isDealAnalyzerOfferAssistantEnabled()) return null;
  const row = await prisma.dealOfferStrategy.findFirst({
    where: { propertyId: listingId },
    orderBy: { updatedAt: "desc" },
  });
  if (!row) return null;
  return mapOfferStrategyRow(row);
}
