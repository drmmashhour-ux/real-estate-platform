import { prisma } from "@/lib/db";
import { engineFlags } from "@/config/feature-flags";
import { computeGrowthOpportunityScore01, toScore100 } from "../growth.scoring";

const MIN_INVENTORY = 8;

function slugifyPart(s: string): string {
  return s
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * Creates/updates SEO page *candidates* only — never publishes routes.
 */
export async function scanSeoPageOpportunitiesFromFsboInventory(limitCities = 40): Promise<{ upserts: number }> {
  const legacyOn = engineFlags.seoCandidateGenerationV1 && engineFlags.growthAutopilotV1;
  const v2On = engineFlags.growthV2 && engineFlags.seoPageGeneratorV2;
  if (!legacyOn && !v2On) {
    return { upserts: 0 };
  }

  const grouped = await prisma.fsboListing.groupBy({
    by: ["city", "propertyType", "listingDealType"],
    where: {
      status: "ACTIVE",
      moderationStatus: "APPROVED",
      propertyType: { not: null },
    },
    _count: { _all: true },
    orderBy: { city: "asc" },
  });

  let upserts = 0;
  const capped = grouped.filter((g) => g._count._all >= MIN_INVENTORY).slice(0, limitCities * 6);

  for (const g of capped) {
    const city = g.city?.trim() ?? "";
    const pt = (g.propertyType ?? "home").trim();
    const deal = (g.listingDealType ?? "SALE").trim();
    if (!city) continue;
    const slug = `${slugifyPart(city)}-${slugifyPart(pt)}-${slugifyPart(deal)}`.slice(0, 250);
    const inv01 = Math.min(1, g._count._all / 80);
    const score01 = computeGrowthOpportunityScore01({
      inventoryStrength01: inv01,
      conversionPotential01: 0.45,
      engagement01: 0.4,
      trustQuality01: 0.5,
      freshness01: 0.45,
      businessPriority01: 0.55,
    });

    await prisma.seoPageOpportunity.upsert({
      where: { slug },
      create: {
        slug,
        pageType: "city_property_deal",
        city,
        propertyType: pt,
        inventoryCount: g._count._all,
        opportunityScore: toScore100(score01),
        status: "candidate",
        metadataJson: { listingDealType: deal, minInventoryRule: MIN_INVENTORY },
      },
      update: {
        inventoryCount: g._count._all,
        opportunityScore: toScore100(score01),
        metadataJson: { listingDealType: deal, minInventoryRule: MIN_INVENTORY },
      },
    });
    upserts++;
  }

  return { upserts };
}
