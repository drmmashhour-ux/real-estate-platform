import { prisma } from "@/lib/db";

const MOCK_EXTERNAL_NOTE = "Mock external publish — integration pending compliance review.";

export async function listChannels() {
  return prisma.bnhubDistributionChannel.findMany({
    orderBy: [{ channelType: "asc" }, { code: "asc" }],
  });
}

export async function getChannelByCode(code: string) {
  return prisma.bnhubDistributionChannel.findUnique({ where: { code } });
}

export async function createDistributionPlan(campaignId: string, channelCodes: string[]) {
  const channels = await prisma.bnhubDistributionChannel.findMany({
    where: { code: { in: channelCodes } },
  });
  const rows = await prisma.$transaction(
    channels.map((ch) =>
      prisma.bnhubCampaignDistribution.create({
        data: {
          campaignId,
          channelId: ch.id,
          distributionStatus: "DRAFT",
          payloadJson: { channelCode: ch.code, planned: true },
        },
      })
    )
  );
  for (const r of rows) {
    await prisma.bnhubMarketingEvent.create({
      data: {
        campaignId,
        distributionId: r.id,
        eventType: "GENERATED",
        eventSource: "SYSTEM",
        eventDataJson: { plan: true },
      },
    });
  }
  return rows;
}

export async function scheduleDistribution(distributionId: string, scheduledAt: Date) {
  return prisma.bnhubCampaignDistribution.update({
    where: { id: distributionId },
    data: { distributionStatus: "SCHEDULED", scheduledAt },
  });
}

async function publishInternal(
  distributionId: string,
  summary: string,
  payloadExtra: Record<string, unknown>
) {
  const row = await prisma.bnhubCampaignDistribution.update({
    where: { id: distributionId },
    data: {
      distributionStatus: "PUBLISHED",
      publishedAt: new Date(),
      resultSummary: summary,
      impressions: { increment: 120 },
      payloadJson: payloadExtra as object,
    },
  });
  await prisma.bnhubMarketingEvent.create({
    data: {
      campaignId: row.campaignId,
      distributionId: row.id,
      eventType: "PUBLISHED",
      eventSource: "SYSTEM",
      eventDataJson: { internal: true },
    },
  });
  return row;
}

export async function publishToInternalHomepageMock(distributionId: string) {
  const d = await prisma.bnhubCampaignDistribution.findUniqueOrThrow({
    where: { id: distributionId },
    include: { campaign: true, channel: true },
  });
  if (d.channel.code !== "internal_homepage") throw new Error("Wrong channel");
  return publishInternal(distributionId, "Published to BNHub homepage featured queue (internal).", {
    listingId: d.campaign.listingId,
    campaignId: d.campaignId,
    slotWeight: 1,
    badge: "Promoted by campaign",
  });
}

export async function publishToInternalSearchBoostMock(distributionId: string, boostPoints = 8) {
  const cap = Math.min(12, Math.max(0, boostPoints));
  const d = await prisma.bnhubCampaignDistribution.findUniqueOrThrow({
    where: { id: distributionId },
    include: { campaign: true, channel: true },
  });
  if (d.channel.code !== "internal_search_boost") throw new Error("Wrong channel");
  return publishInternal(
    distributionId,
    `Search boost applied (capped +${cap} rank points, internal only).`,
    { listingId: d.campaign.listingId, boostPoints: cap }
  );
}

export async function publishToInternalEmailMock(distributionId: string) {
  const d = await prisma.bnhubCampaignDistribution.findUniqueOrThrow({
    where: { id: distributionId },
    include: { campaign: true, channel: true },
  });
  if (d.channel.code !== "internal_email") throw new Error("Wrong channel");
  const listing = await prisma.shortTermListing.findUniqueOrThrow({
    where: { id: d.campaign.listingId },
    select: { title: true, city: true, nightPriceCents: true },
  });
  const html = `<p><strong>${listing.title}</strong> — ${listing.city}<br/>From $${(listing.nightPriceCents / 100).toFixed(0)}/night</p><p><em>Newsletter card (internal preview)</em></p>`;
  await prisma.bnhubEmailCampaignQueue.create({
    data: {
      campaignId: d.campaignId,
      listingId: d.campaign.listingId,
      subject: `BNHub spotlight: ${listing.title}`,
      bodyHtml: html,
      status: "QUEUED",
      scheduledAt: new Date(Date.now() + 86400000),
    },
  });
  return publishInternal(distributionId, "Queued internal email card (newsletter integration pending).", {
    listingId: d.campaign.listingId,
  });
}

export async function publishToInternalBlogFeedMock(distributionId: string) {
  const d = await prisma.bnhubCampaignDistribution.findUniqueOrThrow({
    where: { id: distributionId },
    include: { campaign: true, channel: true },
  });
  if (d.channel.code !== "internal_blog_feed") throw new Error("Wrong channel");
  return publishInternal(distributionId, "Blog / feed card generated (internal CMS wiring optional).", {
    listingId: d.campaign.listingId,
    feedCard: true,
  });
}

async function mockExternal(distributionId: string, channelLabel: string) {
  const row = await prisma.bnhubCampaignDistribution.update({
    where: { id: distributionId },
    data: {
      distributionStatus: "PUBLISHED",
      publishedAt: new Date(),
      resultSummary: `${MOCK_EXTERNAL_NOTE} (${channelLabel})`,
      impressions: { increment: 500 },
      clicks: { increment: 12 },
      payloadJson: { mockExternal: true },
    },
  });
  await prisma.bnhubMarketingEvent.create({
    data: {
      campaignId: row.campaignId,
      distributionId: row.id,
      eventType: "PUBLISHED",
      eventSource: "SYSTEM",
      eventDataJson: { mockExternal: true },
    },
  });
  return row;
}

export const publishToInstagramMock = (id: string) => mockExternal(id, "Instagram");
export const publishToFacebookMock = (id: string) => mockExternal(id, "Facebook");
export const publishToTikTokMock = (id: string) => mockExternal(id, "TikTok");
export const publishToGoogleAdsMock = (id: string) => mockExternal(id, "Google Ads");

export async function exportWhatsappPromo(listingId: string, baseUrl?: string) {
  const l = await prisma.shortTermListing.findUniqueOrThrow({
    where: { id: listingId },
    select: {
      title: true,
      city: true,
      nightPriceCents: true,
      listingCode: true,
      maxGuests: true,
      amenities: true,
    },
  });
  const am = Array.isArray(l.amenities)
    ? l.amenities.filter((x): x is string => typeof x === "string").slice(0, 5)
    : [];
  const origin = baseUrl?.replace(/\/$/, "") ?? "https://bnhub.app";
  const path = l.listingCode ? `/bnhub/${l.listingCode}` : `/bnhub/listings/${listingId}`;
  const link = `${origin}${path}`;
  return `🏠 *${l.title}* — ${l.city}
💰 From $${(l.nightPriceCents / 100).toFixed(0)}/night · ${l.maxGuests} guests
✨ ${am.join(", ") || "Great stay"}
👉 Book: ${link}
_Sent via BNHub marketing export (internal)._`;
}

export async function recordDistributionResult(
  id: string,
  patch: Partial<{
    impressions: number;
    clicks: number;
    leads: number;
    saves: number;
    shares: number;
    bookings: number;
    spendCents: number;
    revenueAttributedCents: number;
    roiEstimate: number;
    resultSummary: string;
  }>
) {
  return prisma.bnhubCampaignDistribution.update({
    where: { id },
    data: patch,
  });
}
