import { prisma } from "@/lib/db";
import { logInfo } from "@/lib/logger";
import { appendPortfolioAuditEvent } from "./portfolio-events.service";

const TAG = "[portfolio.os]";

async function refreshPortfolioTotals(portfolioId: string): Promise<void> {
  const links = await prisma.lecipmBrokerPortfolioAssetLink.findMany({
    where: { portfolioId },
    include: {
      asset: { select: { acquisitionPrice: true } },
    },
  });

  const totalAssets = links.length;
  const totalValue = links.reduce((sum, l) => sum + (l.asset.acquisitionPrice ?? 0), 0);

  await prisma.lecipmBrokerPortfolio.update({
    where: { id: portfolioId },
    data: { totalAssets, totalValue },
  });
}

export async function createPortfolio(ownerUserId: string, input: { name: string; description?: string | null }) {
  const row = await prisma.lecipmBrokerPortfolio.create({
    data: {
      ownerUserId,
      name: input.name.slice(0, 512),
      description: input.description?.slice(0, 8000),
      totalAssets: 0,
      totalValue: 0,
    },
  });

  await appendPortfolioAuditEvent(row.id, {
    eventType: "PORTFOLIO_CREATED",
    summary: `Portfolio "${row.name}"`,
    actorUserId: ownerUserId,
    metadataJson: { portfolioId: row.id },
  });

  logInfo(TAG, { id: row.id });
  return row;
}

export async function assertUserCanAttachAsset(actorUserId: string, actorRole: import("@prisma/client").PlatformRole, assetId: string) {
  const asset = await prisma.lecipmPortfolioAsset.findUnique({
    where: { id: assetId },
    include: { deal: { select: { brokerId: true, sponsorUserId: true, ownerUserId: true } } },
  });
  if (!asset) throw new Error("Asset does not exist (must come from Phase 6 pipeline)");
  if (actorRole === "ADMIN") return asset;
  if (asset.deal.brokerId === actorUserId) return asset;
  if (asset.deal.ownerUserId === actorUserId) return asset;
  if (asset.deal.sponsorUserId === actorUserId) return asset;
  throw new Error("Forbidden: portfolio owner context must align with asset deal principals");
}

export async function addAssetToPortfolio(
  portfolioId: string,
  assetId: string,
  allocationWeight: number | null | undefined,
  actorUserId: string,
  actorRole: import("@prisma/client").PlatformRole
) {
  const portfolio = await prisma.lecipmBrokerPortfolio.findUnique({ where: { id: portfolioId } });
  if (!portfolio) throw new Error("Portfolio not found");

  await assertUserCanAttachAsset(actorUserId, actorRole, assetId);

  if (portfolio.ownerUserId !== actorUserId && actorRole !== "ADMIN") {
    throw new Error("Forbidden");
  }

  await prisma.lecipmBrokerPortfolioAssetLink.create({
    data: {
      portfolioId,
      assetId,
      allocationWeight: allocationWeight ?? undefined,
    },
  });

  await refreshPortfolioTotals(portfolioId);

  await appendPortfolioAuditEvent(portfolioId, {
    eventType: "ASSET_ADDED",
    summary: `Linked asset ${assetId}`,
    actorUserId,
    metadataJson: { assetId },
  });

  logInfo(TAG, { portfolioId, assetId });
  return prisma.lecipmBrokerPortfolio.findUnique({
    where: { id: portfolioId },
    include: {
      assetLinks: { include: { asset: true } },
    },
  });
}

export async function listPortfolioAssets(portfolioId: string) {
  return prisma.lecipmBrokerPortfolioAssetLink.findMany({
    where: { portfolioId },
    include: {
      asset: {
        include: {
          deal: { select: { dealNumber: true, title: true } },
        },
      },
    },
    orderBy: { addedAt: "desc" },
  });
}

export async function listPortfoliosForOwner(ownerUserId: string) {
  return prisma.lecipmBrokerPortfolio.findMany({
    where: { ownerUserId },
    orderBy: { createdAt: "desc" },
    take: 100,
  });
}

export async function findPrimaryPortfolioForAsset(assetId: string): Promise<string | null> {
  const link = await prisma.lecipmBrokerPortfolioAssetLink.findFirst({
    where: { assetId },
    orderBy: { addedAt: "desc" },
    select: { portfolioId: true },
  });
  return link?.portfolioId ?? null;
}

export async function getPortfolioById(portfolioId: string) {
  return prisma.lecipmBrokerPortfolio.findUnique({
    where: { id: portfolioId },
    include: {
      assetLinks: {
        include: {
          asset: true,
        },
      },
    },
  });
}

export async function approveDecision(decisionId: string, actorUserId: string, actorRole: import("@prisma/client").PlatformRole) {
  const d = await prisma.lecipmBrokerPortfolioDecision.findUnique({
    where: { id: decisionId },
    include: { portfolio: true },
  });
  if (!d) throw new Error("Decision not found");
  if (actorRole !== "ADMIN" && d.portfolio.ownerUserId !== actorUserId) {
    throw new Error("Forbidden");
  }

  const row = await prisma.lecipmBrokerPortfolioDecision.update({
    where: { id: decisionId },
    data: { status: "APPROVED" },
  });

  await appendPortfolioAuditEvent(d.portfolioId, {
    eventType: "DECISION_APPROVED",
    summary: `Decision ${d.decisionType} approved (human gate)`,
    actorUserId,
    metadataJson: { decisionId },
  });

  return row;
}
