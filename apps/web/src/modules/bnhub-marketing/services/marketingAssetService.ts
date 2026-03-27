import type { BnhubMarketingAssetType, Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { generateDeterministicAssetPack, selectMarketingAngle } from "./marketingAIService";

// Re-export helper used by campaign service pattern
export async function fetchListingMarketingInput(listingId: string) {
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

async function getInput(listingId: string) {
  return fetchListingMarketingInput(listingId);
}

export async function generateAssetPackFromListing(campaignId: string, langs: ("en" | "fr")[] = ["en", "fr"]) {
  const campaign = await prisma.bnhubMarketingCampaign.findUniqueOrThrow({
    where: { id: campaignId },
    select: { listingId: true },
  });
  const input = await getInput(campaign.listingId);
  const angle = selectMarketingAngle(input);
  const drafts = generateDeterministicAssetPack(input, angle, langs);

  await prisma.bnhubMarketingAsset.deleteMany({
    where: { campaignId, isActive: true },
  });

  const created = await prisma.$transaction(
    drafts.map((d) =>
      prisma.bnhubMarketingAsset.create({
        data: {
          campaignId,
          listingId: campaign.listingId,
          assetType: d.assetType as BnhubMarketingAssetType,
          languageCode: d.languageCode,
          tone: d.tone,
          title: d.title,
          content: d.content,
          metadataJson: (d.metadataJson ?? undefined) as Prisma.InputJsonValue | undefined,
          aiGenerated: true,
          humanEdited: false,
          versionNo: 1,
          isActive: true,
        },
      })
    )
  );

  await prisma.bnhubMarketingEvent.create({
    data: {
      campaignId,
      eventType: "GENERATED",
      eventSource: "AI",
      eventDataJson: { assets: created.length, mode: "deterministic_mock", angle },
    },
  });

  return created;
}

export async function regenerateSingleAsset(
  campaignId: string,
  assetType: BnhubMarketingAssetType,
  languageCode: string
) {
  const campaign = await prisma.bnhubMarketingCampaign.findUniqueOrThrow({
    where: { id: campaignId },
    select: { listingId: true },
  });
  const input = await getInput(campaign.listingId);
  const angle = selectMarketingAngle(input);
  const drafts = generateDeterministicAssetPack(input, angle, [languageCode as "en" | "fr"]).filter(
    (d) => d.assetType === assetType && d.languageCode === languageCode
  );
  const d = drafts[0];
  if (!d) throw new Error("No draft for type/lang");

  await prisma.bnhubMarketingAsset.updateMany({
    where: { campaignId, assetType, languageCode },
    data: { isActive: false },
  });

  return prisma.bnhubMarketingAsset.create({
    data: {
      campaignId,
      listingId: campaign.listingId,
      assetType,
      languageCode,
      tone: d.tone,
      title: d.title,
      content: d.content,
      metadataJson: (d.metadataJson ?? undefined) as Prisma.InputJsonValue | undefined,
      aiGenerated: true,
      humanEdited: false,
      versionNo: 1,
      isActive: true,
    },
  });
}

export async function saveEditedAsset(
  id: string,
  patch: { title?: string | null; content: string }
) {
  return prisma.bnhubMarketingAsset.update({
    where: { id },
    data: {
      title: patch.title,
      content: patch.content,
      humanEdited: true,
      versionNo: { increment: 1 },
    },
  });
}

export async function listAssetsByCampaign(campaignId: string) {
  return prisma.bnhubMarketingAsset.findMany({
    where: { campaignId, isActive: true },
    orderBy: [{ languageCode: "asc" }, { assetType: "asc" }],
  });
}

export async function getActiveAssetsForCampaign(campaignId: string) {
  return listAssetsByCampaign(campaignId);
}
