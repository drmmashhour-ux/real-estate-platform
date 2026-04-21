import { PlatformRole } from "@prisma/client";
import { prisma } from "@/lib/db";
import { logInfo } from "@/lib/logger";
import type { SerializedEsgAction } from "./esg-action.types";

const TAG = "[esg-action-portfolio]";

function serialize(a: {
  id: string;
  listingId: string;
  title: string;
  description: string;
  category: string;
  actionType: string;
  priority: string;
  status: string;
  reasonCode: string;
  reasonText: string | null;
  estimatedScoreImpact: number | null;
  estimatedCarbonImpact: number | null;
  estimatedConfidenceImpact: number | null;
  estimatedCostBand: string | null;
  estimatedEffortBand: string | null;
  estimatedTimelineBand: string | null;
  paybackBand: string | null;
  ownerType: string | null;
  assigneeUserId: string | null;
  implementationNotes: string | null;
  generatedFromVersion: string | null;
  createdAt: Date;
  updatedAt: Date;
  completedAt: Date | null;
}): SerializedEsgAction {
  return {
    id: a.id,
    listingId: a.listingId,
    title: a.title,
    description: a.description,
    category: a.category,
    actionType: a.actionType,
    priority: a.priority,
    status: a.status,
    reasonCode: a.reasonCode,
    reasonText: a.reasonText,
    estimatedScoreImpact: a.estimatedScoreImpact,
    estimatedCarbonImpact: a.estimatedCarbonImpact,
    estimatedConfidenceImpact: a.estimatedConfidenceImpact,
    estimatedCostBand: a.estimatedCostBand,
    estimatedEffortBand: a.estimatedEffortBand,
    estimatedTimelineBand: a.estimatedTimelineBand,
    paybackBand: a.paybackBand,
    ownerType: a.ownerType,
    assigneeUserId: a.assigneeUserId,
    implementationNotes: a.implementationNotes,
    generatedFromVersion: a.generatedFromVersion,
    createdAt: a.createdAt.toISOString(),
    updatedAt: a.updatedAt.toISOString(),
    completedAt: a.completedAt?.toISOString() ?? null,
  };
}

export async function getListingIdsForPortfolioUser(
  userId: string,
  role: PlatformRole | null | undefined
): Promise<string[]> {
  if (role === PlatformRole.ADMIN) {
    const rows = await prisma.listing.findMany({
      select: { id: true },
      orderBy: { updatedAt: "desc" },
      take: 300,
    });
    return rows.map((r) => r.id);
  }

  const rows = await prisma.listing.findMany({
    where: {
      OR: [{ ownerId: userId }, { brokerAccesses: { some: { brokerId: userId } } }],
    },
    select: { id: true },
    orderBy: { updatedAt: "desc" },
    take: 200,
  });
  return rows.map((r) => r.id);
}

export async function recomputePortfolioActionSummary(
  userId: string,
  role?: PlatformRole | null
): Promise<void> {
  const listingIds = await getListingIdsForPortfolioUser(userId, role);
  if (listingIds.length === 0) {
    await prisma.esgPortfolioActionSummary.create({
      data: {
        ownerId: userId,
        totalAssets: 0,
        totalOpenActions: 0,
        criticalActions: 0,
        quickWins: 0,
        capexActions: 0,
        averagePotentialScoreUplift: null,
        summaryJson: { listings: [], generatedAt: new Date().toISOString() },
      },
    });
    logInfo(`${TAG} empty portfolio`, { userId });
    return;
  }

  const actions = await prisma.esgAction.findMany({
    where: {
      listingId: { in: listingIds },
      status: { in: ["OPEN", "IN_PROGRESS", "BLOCKED"] },
    },
    include: {
      listing: { select: { id: true, title: true, listingCode: true } },
    },
  });

  const critical = actions.filter((a) => a.priority === "CRITICAL").length;
  const quickWins = actions.filter((a) => a.actionType === "QUICK_WIN").length;
  const capex = actions.filter((a) => a.actionType === "CAPEX").length;

  const upliftSamples = actions
    .map((a) => a.estimatedScoreImpact)
    .filter((x): x is number => typeof x === "number");
  const avgUplift =
    upliftSamples.length > 0 ?
      upliftSamples.reduce((s, x) => s + x, 0) / upliftSamples.length
    : null;

  const byListing = new Map<string, { count: number; critical: number; title: string; code: string }>();
  for (const a of actions) {
    const cur = byListing.get(a.listingId) ?? {
      count: 0,
      critical: 0,
      title: a.listing.title,
      code: a.listing.listingCode,
    };
    cur.count += 1;
    if (a.priority === "CRITICAL") cur.critical += 1;
    byListing.set(a.listingId, cur);
  }

  const topPriorityAssets = [...byListing.entries()]
    .map(([listingId, v]) => ({
      listingId,
      title: v.title,
      listingCode: v.code,
      openActions: v.count,
      criticalOpen: v.critical,
    }))
    .sort((a, b) => b.criticalOpen - a.criticalOpen || b.openActions - a.openActions)
    .slice(0, 12);

  const utilityGap = actions.filter((a) => a.reasonCode === "EVIDENCE_UTILITY_BILL").length;
  const certGap = actions.filter((a) => a.reasonCode === "EVIDENCE_CERTIFICATION_PROOF").length;
  const climateGap = actions.filter((a) => a.reasonCode === "DOC_CLIMATE_RISK_PLAN").length;

  await prisma.esgPortfolioActionSummary.create({
    data: {
      ownerId: userId,
      totalAssets: listingIds.length,
      totalOpenActions: actions.length,
      criticalActions: critical,
      quickWins,
      capexActions: capex,
      averagePotentialScoreUplift: avgUplift,
      summaryJson: {
        topPriorityAssets,
        portfolioQuickWinPatterns: [
          ...(utilityGap > 0 ?
            [`Upload missing utility evidence on ${utilityGap} asset${utilityGap === 1 ? "" : "s"}`]
          : []),
          ...(certGap > 0 ?
            [`Verify certifications on ${certGap} asset${certGap === 1 ? "" : "s"}`]
          : []),
          ...(climateGap > 0 ?
            [`Add climate / adaptation plan on ${climateGap} asset${climateGap === 1 ? "" : "s"}`]
          : []),
        ],
        capexCandidates: actions
          .filter((a) => a.actionType === "CAPEX")
          .slice(0, 20)
          .map(serialize),
        acquisitionBlockers: actions
          .filter((a) => a.priority === "CRITICAL" || a.reasonCode.includes("DOC_"))
          .slice(0, 25)
          .map(serialize),
        pipeline: {
          OPEN: actions.filter((a) => a.status === "OPEN").length,
          IN_PROGRESS: actions.filter((a) => a.status === "IN_PROGRESS").length,
          BLOCKED: actions.filter((a) => a.status === "BLOCKED").length,
        },
      },
    },
  });

  logInfo(`${TAG} recomputed`, { userId, open: actions.length });
}

export async function getLatestPortfolioSummaryJson(userId: string) {
  return prisma.esgPortfolioActionSummary.findFirst({
    where: { ownerId: userId },
    orderBy: { createdAt: "desc" },
  });
}
