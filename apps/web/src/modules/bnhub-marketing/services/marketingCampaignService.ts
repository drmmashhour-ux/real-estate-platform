import {
  type BnhubMarketingCampaignStatus,
  type BnhubMarketingCampaignObjective,
  type BnhubMarketingBudgetMode,
} from "@prisma/client";
import { prisma } from "@/lib/db";
import { canLaunchLuxuryMarketingCampaign, canLaunchPremiumMarketingCampaign } from "./bnhubListingPromotionGates";
import {
  buildCampaignStrategySummary,
  selectMarketingAngle,
  type ListingMarketingInput,
} from "./marketingAIService";

async function loadListingInput(listingId: string): Promise<ListingMarketingInput> {
  const l = await prisma.shortTermListing.findUniqueOrThrow({
    where: { id: listingId },
    select: {
      title: true,
      city: true,
      region: true,
      country: true,
      description: true,
      propertyType: true,
      roomType: true,
      nightPriceCents: true,
      maxGuests: true,
      beds: true,
      baths: true,
      amenities: true,
      verificationStatus: true,
      minStayNights: true,
      maxStayNights: true,
      cancellationPolicy: true,
      listingCode: true,
    },
  });
  return { ...l, verificationStatus: l.verificationStatus };
}

export async function createCampaign(params: {
  listingId: string;
  hostUserId: string;
  createdBy?: string | null;
  campaignName: string;
  objective: BnhubMarketingCampaignObjective;
  targetCity?: string | null;
  targetCountry?: string | null;
  targetRegion?: string | null;
  budgetMode?: BnhubMarketingBudgetMode;
}) {
  const listing = await prisma.shortTermListing.findUniqueOrThrow({
    where: { id: params.listingId },
    select: { ownerId: true },
  });
  if (listing.ownerId !== params.hostUserId) {
    throw new Error("Host must own listing");
  }
  const input = await loadListingInput(params.listingId);
  const angle = selectMarketingAngle(input);
  const aiStrategySummary = buildCampaignStrategySummary(input, angle, "en");

  const c = await prisma.bnhubMarketingCampaign.create({
    data: {
      listingId: params.listingId,
      hostUserId: params.hostUserId,
      createdBy: params.createdBy ?? params.hostUserId,
      campaignName: params.campaignName,
      objective: params.objective,
      status: "DRAFT",
      targetCity: params.targetCity ?? input.city,
      targetCountry: params.targetCountry ?? input.country ?? "CA",
      targetRegion: params.targetRegion ?? input.region,
      budgetMode: params.budgetMode ?? "INTERNAL_ONLY",
      aiStrategySummary,
    },
  });

  await prisma.bnhubMarketingEvent.create({
    data: {
      campaignId: c.id,
      eventType: "GENERATED",
      eventSource: "SYSTEM",
      eventDataJson: { action: "campaign_created", angle },
    },
  });

  return c;
}

export async function updateCampaign(
  id: string,
  patch: Partial<{
    campaignName: string;
    objective: BnhubMarketingCampaignObjective;
    status: BnhubMarketingCampaignStatus;
    targetCity: string | null;
    targetCountry: string | null;
    targetRegion: string | null;
    targetAudienceJson: object;
    budgetMode: BnhubMarketingBudgetMode;
    estimatedBudgetCents: number | null;
    currency: string;
    startDate: Date | null;
    endDate: Date | null;
    notes: string | null;
    aiStrategySummary: string | null;
  }>
) {
  return prisma.bnhubMarketingCampaign.update({
    where: { id },
    data: patch,
  });
}

export async function archiveCampaign(id: string) {
  return updateCampaign(id, { status: "ARCHIVED" });
}

export async function changeCampaignStatus(id: string, status: BnhubMarketingCampaignStatus) {
  if (status === "ACTIVE" || status === "SCHEDULED") {
    const row = await prisma.bnhubMarketingCampaign.findUnique({
      where: { id },
      select: { listingId: true, budgetMode: true },
    });
    if (row) {
      const gate =
        row.budgetMode === "PAID_EXTERNAL"
          ? await canLaunchLuxuryMarketingCampaign(row.listingId)
          : await canLaunchPremiumMarketingCampaign(row.listingId);
      if (!gate.allowed) {
        throw new Error(`Campaign launch blocked: ${gate.reasons.join(" ")}`);
      }
    }
  }
  const c = await updateCampaign(id, { status });
  await prisma.bnhubMarketingEvent.create({
    data: {
      campaignId: id,
      eventType: status === "FAILED" ? "FAILED" : "SCHEDULED",
      eventSource: "ADMIN",
      eventDataJson: { to: status },
    },
  });
  return c;
}

export async function listCampaigns(filters: {
  hostUserId?: string;
  status?: BnhubMarketingCampaignStatus;
  listingId?: string;
  take?: number;
  skip?: number;
}) {
  const where: Record<string, unknown> = {};
  if (filters.hostUserId) where.hostUserId = filters.hostUserId;
  if (filters.status) where.status = filters.status;
  if (filters.listingId) where.listingId = filters.listingId;

  const [total, rows] = await Promise.all([
    prisma.bnhubMarketingCampaign.count({ where }),
    prisma.bnhubMarketingCampaign.findMany({
      where,
      orderBy: { updatedAt: "desc" },
      take: filters.take ?? 40,
      skip: filters.skip ?? 0,
      include: {
        listing: { select: { id: true, title: true, city: true, listingCode: true, nightPriceCents: true } },
      },
    }),
  ]);
  return { total, campaigns: rows };
}

export async function getCampaignById(id: string) {
  return prisma.bnhubMarketingCampaign.findUnique({
    where: { id },
    include: {
      listing: {
        select: {
          id: true,
          title: true,
          city: true,
          listingCode: true,
          nightPriceCents: true,
          photos: true,
          ownerId: true,
        },
      },
      assets: { orderBy: [{ languageCode: "asc" }, { assetType: "asc" }] },
      distributions: { include: { channel: true }, orderBy: { createdAt: "desc" } },
      recommendations: { where: { status: "OPEN" } },
      events: { orderBy: { createdAt: "desc" }, take: 80 },
    },
  });
}

export async function duplicateCampaign(id: string, createdBy: string) {
  const src = await getCampaignById(id);
  if (!src) throw new Error("Not found");
  const copy = await prisma.bnhubMarketingCampaign.create({
    data: {
      listingId: src.listingId,
      hostUserId: src.hostUserId,
      createdBy,
      campaignName: `${src.campaignName} (copy)`,
      objective: src.objective,
      status: "DRAFT",
      targetRegion: src.targetRegion,
      targetCountry: src.targetCountry,
      targetCity: src.targetCity,
      targetAudienceJson: src.targetAudienceJson ?? undefined,
      budgetMode: src.budgetMode,
      estimatedBudgetCents: src.estimatedBudgetCents,
      currency: src.currency,
      notes: src.notes,
      aiStrategySummary: src.aiStrategySummary,
    },
  });
  if (src.assets.length) {
    await prisma.bnhubMarketingAsset.createMany({
      data: src.assets.map((a) => ({
        campaignId: copy.id,
        listingId: src.listingId,
        assetType: a.assetType,
        languageCode: a.languageCode,
        tone: a.tone,
        title: a.title,
        content: a.content,
        metadataJson: a.metadataJson ?? undefined,
        aiGenerated: a.aiGenerated,
        humanEdited: false,
        versionNo: 1,
        isActive: true,
      })),
    });
  }
  return copy;
}

export async function deleteCampaignHard(id: string) {
  await prisma.bnhubMarketingCampaign.delete({ where: { id } });
}
