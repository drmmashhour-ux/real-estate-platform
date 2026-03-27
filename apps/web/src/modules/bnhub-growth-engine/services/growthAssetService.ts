/**
 * Asset domain API — delegates to growth campaign flows (single source of truth in DB).
 */
import { prisma } from "@/lib/db";
import { BnhubGrowthAssetFamily } from "@prisma/client";
import { generateAssetsForCampaign, approveCampaignAssets } from "./growthCampaignService";
import { appendGrowthAuditLog } from "./growthAuditService";

export { generateAssetsForCampaign as generateAssetPackFromListing };

export async function listAssetsByCampaign(campaignId: string) {
  return prisma.bnhubGrowthAsset.findMany({
    where: { campaignId },
    orderBy: [{ languageCode: "asc" }, { assetFamily: "asc" }],
  });
}

export async function getActiveAssetsForCampaign(campaignId: string) {
  return prisma.bnhubGrowthAsset.findMany({
    where: { campaignId, isActive: true },
    orderBy: [{ languageCode: "asc" }, { assetFamily: "asc" }],
  });
}

export async function approveAllDraftAssets(campaignId: string) {
  return approveCampaignAssets(campaignId);
}

export async function rejectAsset(assetId: string) {
  const row = await prisma.bnhubGrowthAsset.update({
    where: { id: assetId },
    data: { approvalStatus: "REJECTED", isActive: false },
  });
  await appendGrowthAuditLog({
    actorType: "ADMIN",
    entityType: "bnhub_growth_asset",
    entityId: assetId,
    actionType: "reject_asset",
    actionSummary: "Asset rejected",
  });
  return row;
}

export async function saveEditedAsset(
  assetId: string,
  data: Partial<{
    title: string | null;
    content: string;
    ctaText: string | null;
    approvalStatus: "DRAFT" | "APPROVED" | "REJECTED";
  }>
) {
  return prisma.bnhubGrowthAsset.update({
    where: { id: assetId },
    data: {
      ...data,
      humanEdited: true,
      versionNo: { increment: 1 },
    },
  });
}

export async function regenerateSingleAsset(params: {
  campaignId: string;
  listingId: string;
  family: BnhubGrowthAssetFamily;
  languageCode: string;
  title: string | null;
  content: string;
  ctaText: string | null;
  platformHint: string | null;
}) {
  return prisma.bnhubGrowthAsset.create({
    data: {
      campaignId: params.campaignId,
      listingId: params.listingId,
      assetFamily: params.family,
      languageCode: params.languageCode,
      title: params.title,
      content: params.content,
      ctaText: params.ctaText,
      platformHint: params.platformHint,
      aiGenerated: true,
      approvalStatus: "DRAFT",
    },
  });
}
