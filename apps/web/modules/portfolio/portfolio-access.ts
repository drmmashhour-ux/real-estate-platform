import type { PlatformRole } from "@prisma/client";
import { prisma } from "@/lib/db";

/** Investment pipeline + listing-linked context for financing/covenant signals. */
export interface PortfolioAssetContext {
  assetId: string;
  assetName: string;
  listingId: string | null;
  dealId: string;
  buyerId: string;
  sellerId: string;
  brokerId: string | null;
  revenueInitialized: boolean;
  operationsInitialized: boolean;
  onboardingMetadata: Record<string, unknown>;
  esgComposite: number | null;
  esgEvidenceConfidence: number | null;
  esgDataCoveragePercent: number | null;
  esgHighCarbonMaterials: boolean;
  complianceOpenCount: number;
  complianceHighSeverityOpen: number;
  esgOpenCriticalOrHigh: number;
  pipelineDealId: string | null;
  financingOpenConditions: number;
  activeCovenants: number;
  pipelineChecklistOpen: number;
}

export async function listAccessibleAssetIds(userId: string, role: PlatformRole): Promise<string[]> {
  if (role === "ADMIN") {
    const rows = await prisma.postCloseAsset.findMany({
      where: { status: "ACTIVE" },
      select: { id: true },
    });
    return rows.map((r) => r.id);
  }

  const rows = await prisma.postCloseAsset.findMany({
    where: {
      status: "ACTIVE",
      deal: {
        OR: [{ buyerId: userId }, { sellerId: userId }, { brokerId: userId }],
      },
    },
    select: { id: true },
  });
  return rows.map((r) => r.id);
}

export async function assertAssetAccessible(userId: string, role: PlatformRole, assetId: string): Promise<void> {
  const ids = await listAccessibleAssetIds(userId, role);
  if (!ids.includes(assetId)) {
    const err = new Error("Forbidden");
    (err as Error & { status?: number }).status = 403;
    throw err;
  }
}

export async function loadPortfolioAssetContext(assetId: string): Promise<PortfolioAssetContext | null> {
  const asset = await prisma.postCloseAsset.findUnique({
    where: { id: assetId },
    include: {
      deal: true,
      esgProfile: true,
      listing: true,
    },
  });
  if (!asset) return null;

  const listingId = asset.listingId;
  let complianceOpenCount = 0;
  let complianceHighSeverityOpen = 0;
  if (asset.dealId || listingId) {
    const cases = await prisma.complianceCase.findMany({
      where: {
        status: "open",
        OR: [...(asset.dealId ? [{ dealId: asset.dealId }] : []), ...(listingId ? [{ listingId }] : [])],
      },
      select: { severity: true },
    });
    complianceOpenCount = cases.length;
    complianceHighSeverityOpen = cases.filter(
      (c) => c.severity === "high" || c.severity === "critical",
    ).length;
  }

  let esgOpenCriticalOrHigh = 0;
  if (listingId) {
    esgOpenCriticalOrHigh = await prisma.esgAction.count({
      where: {
        listingId,
        status: "OPEN",
        priority: { in: ["CRITICAL", "HIGH"] },
      },
    });
  }

  let pipelineDealId: string | null = null;
  let financingOpenConditions = 0;
  let activeCovenants = 0;
  let pipelineChecklistOpen = 0;

  if (listingId) {
    const pd = await prisma.investmentPipelineDeal.findFirst({
      where: { listingId },
      include: {
        financingConditions: { where: { status: "OPEN" } },
        financingCovenants: { where: { status: "ACTIVE" } },
        closingChecklistItems: { where: { status: "OPEN" } },
      },
      orderBy: { updatedAt: "desc" },
    });
    if (pd) {
      pipelineDealId = pd.id;
      financingOpenConditions = pd.financingConditions.length;
      activeCovenants = pd.financingCovenants.length;
      pipelineChecklistOpen = pd.closingChecklistItems.length;
    }
  }

  const onboardingMetadata =
    typeof asset.onboardingMetadataJson === "object" && asset.onboardingMetadataJson !== null
      ? (asset.onboardingMetadataJson as Record<string, unknown>)
      : {};

  const ep = asset.esgProfile;

  return {
    assetId: asset.id,
    assetName: asset.assetName,
    listingId,
    dealId: asset.dealId,
    buyerId: asset.deal.buyerId,
    sellerId: asset.deal.sellerId,
    brokerId: asset.deal.brokerId,
    revenueInitialized: asset.revenueInitialized,
    operationsInitialized: asset.operationsInitialized,
    onboardingMetadata,
    esgComposite: ep?.compositeScore ?? null,
    esgEvidenceConfidence: ep?.evidenceConfidence ?? null,
    esgDataCoveragePercent: ep?.dataCoveragePercent ?? null,
    esgHighCarbonMaterials: ep?.highCarbonMaterials ?? false,
    complianceOpenCount,
    complianceHighSeverityOpen,
    esgOpenCriticalOrHigh,
    pipelineDealId,
    financingOpenConditions,
    activeCovenants,
    pipelineChecklistOpen,
  };
}

export async function loadContextsForAssets(assetIds: string[]): Promise<Map<string, PortfolioAssetContext>> {
  const map = new Map<string, PortfolioAssetContext>();
  for (const id of assetIds) {
    const ctx = await loadPortfolioAssetContext(id);
    if (ctx) map.set(id, ctx);
  }
  return map;
}
