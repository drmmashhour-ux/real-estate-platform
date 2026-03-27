import {
  BnhubMarketingCampaignObjective,
  BnhubMarketingCampaignStatus,
  BnhubMarketingBudgetMode,
} from "@prisma/client";
import { prisma } from "../lib/db";
import { generateAssetPackFromListing } from "../src/modules/bnhub-marketing/services/marketingAssetService";
import { createDistributionPlan } from "../src/modules/bnhub-marketing/services/distributionService";
import { publishToInternalHomepageMock, publishToInternalSearchBoostMock } from "../src/modules/bnhub-marketing/services/distributionService";
import { refreshListingReadiness } from "../src/modules/bnhub-marketing/services/marketingProfileService";

const SEED_LISTINGS = [
  { id: "seed-listing-luxury-mtl", name: "Luxury downtown Montreal" },
  { id: "seed-listing-002", name: "Family Laval" },
  { id: "seed-listing-003", name: "Business metro" },
  { id: "seed-listing-004", name: "Scenic getaway" },
] as const;

/** Idempotent demo rows for BNHub Marketing Engine (after main seed). */
export async function seedBnhubMarketingDemo(hostUserId: string): Promise<void> {
  const existing = await prisma.bnhubMarketingCampaign.count().catch(() => -1);
  if (existing === -1) {
    console.log("  (skip BNHub marketing seed — tables not migrated)");
    return;
  }
  if (existing > 0) {
    console.log("  BNHub marketing demo already present");
    return;
  }

  for (const s of SEED_LISTINGS) {
    const listing = await prisma.shortTermListing.findUnique({ where: { id: s.id } });
    if (!listing) continue;
    await refreshListingReadiness(s.id);
    const camp = await prisma.bnhubMarketingCampaign.create({
      data: {
        listingId: s.id,
        hostUserId,
        createdBy: hostUserId,
        campaignName: `Demo — ${s.name}`,
        objective: BnhubMarketingCampaignObjective.BOOKING_CONVERSION,
        status: BnhubMarketingCampaignStatus.ACTIVE,
        targetCity: listing.city,
        budgetMode: BnhubMarketingBudgetMode.INTERNAL_ONLY,
        aiStrategySummary: `Demo strategy for ${s.name} — internal channels first (EN+FR pack below).`,
      },
    });
    await generateAssetPackFromListing(camp.id, ["en", "fr"]);
    await createDistributionPlan(camp.id, ["internal_homepage", "internal_search_boost"]);
    const distRows = await prisma.bnhubCampaignDistribution.findMany({
      where: { campaignId: camp.id },
      include: { channel: true },
    });
    const home = distRows.find((d) => d.channel.code === "internal_homepage");
    const boost = distRows.find((d) => d.channel.code === "internal_search_boost");
    if (home) await publishToInternalHomepageMock(home.id);
    if (boost) await publishToInternalSearchBoostMock(boost.id, 8);
  }
  console.log("  BNHub marketing demo: campaigns + EN/FR assets + internal publish (luxury + 3 listings when present)");
}
