import { prisma } from "@/lib/db";
import { logInfo } from "@/lib/logger";
import { appendDealAuditEvent } from "@/modules/deals/deal-audit.service";
import { logClosingTimeline } from "./closing-timeline.service";

const TAG = "[closing.asset]";

/** Creates portfolio asset after closing is COMPLETED (guard in caller). */
export async function createAssetFromDeal(dealId: string, actorUserId: string | null) {
  const existing = await prisma.lecipmPortfolioAsset.findFirst({ where: { dealId } });
  if (existing) {
    logInfo(TAG, { dealId, duplicate: true });
    return existing;
  }

  const closing = await prisma.lecipmPipelineDealClosing.findUnique({ where: { dealId } });
  if (!closing || closing.closingStatus !== "COMPLETED") {
    throw new Error("Closing must be COMPLETED before asset creation");
  }

  const deal = await prisma.lecipmPipelineDeal.findUnique({
    where: { id: dealId },
    include: {
      transaction: true,
      capitalStack: true,
    },
  });
  if (!deal) throw new Error("Deal not found");

  const price = deal.capitalStack?.totalPurchasePrice ?? 0;
  if (price <= 0) {
    throw new Error("Capital stack purchase price required for asset onboarding");
  }

  const acquisitionDate = closing.closingDate ?? new Date();

  const asset = await prisma.lecipmPortfolioAsset.create({
    data: {
      dealId,
      transactionId: deal.transactionId ?? undefined,
      assetName: deal.title.slice(0, 512),
      propertyId: deal.transaction?.propertyId ?? undefined,
      acquisitionPrice: price,
      acquisitionDate,
      ownershipType: "FEE_SIMPLE",
      strategyType: "HOLD",
      status: "ACTIVE",
    },
  });

  const closingDocs = await prisma.lecipmPipelineDealClosingDocument.findMany({
    where: { closingId: closing.id },
    select: { title: true, fileUrl: true, docType: true },
    take: 40,
  });

  for (const d of closingDocs) {
    if (!d.fileUrl) continue;
    await prisma.lecipmPortfolioAssetDocument.create({
      data: {
        assetId: asset.id,
        title: d.title.slice(0, 512),
        fileUrl: d.fileUrl,
        docType: d.docType.slice(0, 32),
      },
    });
  }

  await appendDealAuditEvent(prisma, {
    dealId,
    eventType: "ASSET_CREATED",
    actorUserId,
    summary: `Portfolio asset ${asset.id} created`,
    metadataJson: { assetId: asset.id },
  });
  await logClosingTimeline(deal.transactionId, "ASSET_CREATED", asset.assetName);
  logInfo(TAG, { assetId: asset.id });
  return asset;
}
