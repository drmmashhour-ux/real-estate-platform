import { prisma } from "@/lib/db";
import { isDealAnalyzerPricingAdvisorEnabled } from "@/modules/deal-analyzer/config";
import { mapSellerPricingRow } from "@/modules/deal-analyzer/infrastructure/mappers/phase3DtoMappers";

export async function getSellerPricingAdvisorDto(listingId: string) {
  if (!isDealAnalyzerPricingAdvisorEnabled()) return null;
  const row = await prisma.sellerPricingAdvice.findUnique({
    where: { propertyId: listingId },
  });
  if (!row) return null;
  return mapSellerPricingRow(row);
}
