import { prisma } from "../lib/db";
import {
  createGrowthCampaignDraft,
  generateAssetsForCampaign,
  createDistributionPlan,
  publishDistribution,
} from "../src/modules/bnhub-growth-engine/services/growthCampaignService";
import { ingestLeadFromConnector } from "../src/modules/bnhub-growth-engine/services/leadEngineService";

const DEMO_LISTINGS = [
  "seed-listing-luxury-mtl",
  "seed-listing-002",
  "seed-listing-003",
  "seed-listing-004",
] as const;

export async function seedBnhubGrowthDemo(hostUserId: string): Promise<void> {
  const n = await prisma.bnhubGrowthCampaign.count().catch(() => -1);
  if (n === -1) {
    console.log("  (skip BNHUB growth seed — tables not migrated)");
    return;
  }
  if (n > 0) {
    console.log("  BNHUB growth demo already present");
    return;
  }

  // Ensure host has sufficient autonomy level for seed campaigns
  await prisma.bnhubHostGrowthPrefs.upsert({
    where: { userId: hostUserId },
    create: {
      userId: hostUserId,
      maxAutonomyLevel: "SUPERVISED_AUTOPILOT",
      dailySpendCapCents: 50000,
    },
    update: {
      maxAutonomyLevel: "SUPERVISED_AUTOPILOT",
    },
  });

  for (const listingId of DEMO_LISTINGS) {
    const listing = await prisma.shortTermListing.findUnique({ where: { id: listingId } });
    if (!listing) continue;
    const camp = await createGrowthCampaignDraft({
      listingId,
      hostUserId,
      createdBy: hostUserId,
      campaignName: `Growth demo — ${listing.title.slice(0, 40)}`,
      campaignType: "LISTING_PROMO",
      objective: "BOOKING_CONVERSION",
      autonomyLevel: "SUPERVISED_AUTOPILOT",
    });
    await generateAssetsForCampaign(camp.id);
    await createDistributionPlan(camp.id, ["internal_homepage", "internal_search_boost", "internal_email"]);

    const dists = await prisma.bnhubGrowthDistribution.findMany({
      where: { campaignId: camp.id },
      include: { connector: true },
    });
    for (const d of dists) {
      if (["internal_homepage", "internal_search_boost", "internal_email"].includes(d.connector.connectorCode)) {
        await publishDistribution(d.id, { actorId: hostUserId });
      }
    }
    await prisma.bnhubGrowthCampaign.update({
      where: { id: camp.id },
      data: { status: "ACTIVE" },
    });

    await ingestLeadFromConnector(
      {
        sourceType: "INTERNAL_FORM",
        sourceConnectorCode: "demo",
        listingId,
        campaignId: camp.id,
        hostUserId,
        fullName: "Demo Guest",
        email: `demo-growth-${listingId.slice(-6)}@example.com`,
        message: "Interested in dates next month",
        guestCount: 2,
      },
      { skipDedup: true }
    );
  }

  await prisma.bnhubGrowthRule.create({
    data: {
      scopeType: "GLOBAL",
      ruleName: "Daily optimization scan",
      triggerType: "DAILY_SCAN",
      isEnabled: true,
      conditionsJson: { minImpressions: 200 },
      actionsJson: { action: "evaluate_ctr" },
      cooldownMinutes: 1440,
    },
  });

  console.log("  BNHUB growth demo: campaigns + assets + internal publish + sample leads + global rule");
}
