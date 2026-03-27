import { prisma } from "@/lib/db";
import { isDealAnalyzerMortgageModeEnabled } from "@/modules/deal-analyzer/config";
import { mapAffordabilityRow } from "@/modules/deal-analyzer/infrastructure/mappers/phase3DtoMappers";

export async function getMortgageAffordabilityDto(listingId: string) {
  if (!isDealAnalyzerMortgageModeEnabled()) return null;
  const row = await prisma.dealAffordabilityAnalysis.findFirst({
    where: { propertyId: listingId },
    orderBy: { updatedAt: "desc" },
  });
  if (!row) return null;
  return mapAffordabilityRow(row);
}
