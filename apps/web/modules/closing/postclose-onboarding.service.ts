import { prisma } from "@/lib/db";
import { logInfo } from "@/lib/logger";
import { appendClosingAudit } from "@/modules/closing/closing-audit";
import { bootstrapPostCloseAssetModule } from "@/modules/closing/asset-bootstrap.service";

const TAG = "[asset-onboarding]";

export async function runPostCloseOnboarding(options: {
  dealId: string;
  actorUserId: string;
  closingDate: Date;
}): Promise<string | null> {
  const deal = await prisma.deal.findUnique({
    where: { id: options.dealId },
    select: {
      id: true,
      listingId: true,
      dealCode: true,
      buyerId: true,
    },
  });
  if (!deal) return null;

  const existing = await prisma.postCloseAsset.findUnique({
    where: { dealId: options.dealId },
    select: { id: true },
  });
  if (existing) {
    logInfo(`${TAG}`, { dealId: options.dealId, skipped: true, reason: "asset exists" });
    return existing.id;
  }

  let listingTitle = `Asset · ${deal.dealCode ?? deal.id.slice(0, 8)}`;
  let esgProfileId: string | null = null;
  if (deal.listingId) {
    const listing = await prisma.listing.findUnique({
      where: { id: deal.listingId },
      include: { esgProfile: { select: { id: true } } },
    });
    if (listing?.title) listingTitle = listing.title;
    esgProfileId = listing.esgProfile?.id ?? null;
  }

  const asset = await prisma.postCloseAsset.create({
    data: {
      dealId: deal.id,
      listingId: deal.listingId,
      assetName: listingTitle,
      acquisitionDate: options.closingDate,
      esgProfileId,
      operationsInitialized: false,
      revenueInitialized: false,
      onboardingMetadataJson: {
        checklist: [
          "Verify ESG action center open items",
          "Attach post-close operating budget",
          "Schedule first compliance / insurance review date",
        ],
        healthSnapshot: {
          generatedAt: new Date().toISOString(),
          linkedListingId: deal.listingId,
          esgProfileId,
        },
      } as object,
    },
    select: { id: true },
  });

  await bootstrapPostCloseAssetModule(asset.id, {
    dealId: deal.id,
    listingId: deal.listingId,
  });

  await appendClosingAudit({
    dealId: options.dealId,
    actorUserId: options.actorUserId,
    eventType: "POST_CLOSE_ASSET_CREATED",
    note: asset.id,
    metadataJson: { assetId: asset.id },
  });

  logInfo(`${TAG}`, { dealId: options.dealId, assetId: asset.id });
  return asset.id;
}
