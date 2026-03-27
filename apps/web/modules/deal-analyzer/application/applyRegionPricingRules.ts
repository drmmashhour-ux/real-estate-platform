import { prisma } from "@/lib/db";
import { isDealAnalyzerRegionRulesEnabled } from "@/modules/deal-analyzer/config";
import { RegionalProfileKey } from "@/modules/deal-analyzer/domain/regionalPricing";
import { classifyMarketDensity, inferRegionLabel } from "@/modules/deal-analyzer/infrastructure/services/geographyNormalizationService";
import { buildRegionalPricingRules } from "@/modules/deal-analyzer/infrastructure/services/regionalPricingRulesService";

export async function applyRegionPricingRules(listingId: string) {
  const listing = await prisma.fsboListing.findUnique({
    where: { id: listingId },
    select: { id: true, city: true },
  });
  if (!listing) return { ok: false as const, error: "Listing not found" };

  if (!isDealAnalyzerRegionRulesEnabled()) {
    const rules = buildRegionalPricingRules(RegionalProfileKey.GENERIC, "default");
    return {
      ok: true as const,
      rules,
      regionLabel: "default",
      activeCityListingCount: 0,
    };
  }

  const activeCityListingCount = await prisma.fsboListing.count({
    where: {
      city: listing.city,
      status: "ACTIVE",
      moderationStatus: "APPROVED",
    },
  });

  const profile = classifyMarketDensity(listing.city, activeCityListingCount);
  const regionLabel = inferRegionLabel(listing.city);
  const rules = buildRegionalPricingRules(profile, regionLabel);

  return {
    ok: true as const,
    rules,
    regionLabel,
    activeCityListingCount,
  };
}
