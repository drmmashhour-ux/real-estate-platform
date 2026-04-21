import { prisma } from "@/lib/db";
import { logInfo } from "@/lib/logger";
import { CAPITAL_ELIGIBLE_STAGES } from "@/modules/capital/capital-policy";

const TAG = "[capital-monitoring]";

/** Lightweight hook after memo / IC refresh — logging only (no forced regeneration). */
export async function signalArtifactsMayNeedPackageRefresh(pipelineDealId: string): Promise<void> {
  logInfo(`${TAG}`, {
    pipelineDealId,
    hint: "investor artifacts changed — consider regenerating lender package",
  });
}

/** Called after pipeline stage transitions — informational orchestration signals. */
export async function onPipelineStageChanged(dealId: string, toStage: string): Promise<void> {
  if (!CAPITAL_ELIGIBLE_STAGES.has(toStage) && toStage !== "CONDITIONAL_APPROVAL" && toStage !== "APPROVED") {
    return;
  }

  logInfo(`${TAG}`, {
    dealId,
    toStage,
    hint: "deal eligible for capital stack / lender workflow setup",
  });
}

export async function getCapitalPipelineSummaryForUser(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });

  const where =
    user?.role === "ADMIN" ?
      {}
    : {
        OR: [
          { ownerUserId: userId },
          { sponsorUserId: userId },
          { listing: { ownerId: userId } },
          { listing: { brokerAccesses: { some: { brokerId: userId } } } },
        ],
      };

  const deals = await prisma.investmentPipelineDeal.findMany({
    where,
    select: {
      id: true,
      title: true,
      pipelineStage: true,
      pipelineLenders: { select: { status: true, updatedAt: true } },
      financingOffers: { select: { status: true } },
      financingConditions: { select: { priority: true, status: true } },
      financingCovenants: { select: { status: true } },
    },
    orderBy: { updatedAt: "desc" },
    take: 200,
  });

  let needingLenderAction = 0;
  let offerActivity = 0;
  let blockedBeforeClosing = 0;
  let covenantRisk = 0;

  for (const d of deals) {
    const lenderNeeds =
      d.pipelineLenders.some((l) => ["TARGET", "CONTACTED", "REVIEWING"].includes(l.status)) ?
        1
      : 0;
    needingLenderAction += lenderNeeds;

    const offersAct =
      d.financingOffers.some((o) => o.status === "ACTIVE" || o.status === "SELECTED") ? 1 : 0;
    offerActivity += offersAct;

    const critOpen = d.financingConditions.some(
      (c) => c.priority === "CRITICAL" && !["SATISFIED", "WAIVED"].includes(c.status)
    );
    if (critOpen) blockedBeforeClosing += 1;

    covenantRisk += d.financingCovenants.filter((c) =>
      ["BREACH_RISK", "BREACHED"].includes(c.status)
    ).length;
  }

  return {
    dealsTracked: deals.length,
    needingLenderAction,
    offerActivity,
    blockedBeforeClosing,
    covenantRiskSignals: covenantRisk,
    deals,
  };
}
