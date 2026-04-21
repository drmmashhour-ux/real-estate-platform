import { prisma } from "@/lib/db";
import { logInfo } from "@/lib/logger";
import type { ClosingReadinessResult } from "@/modules/capital/capital.types";

const TAG = "[closing-readiness]";

function criticalOpenFinancingConditions(
  rows: Array<{ priority: string | null; status: string; title: string }>
): string[] {
  return rows
    .filter((r) => r.priority === "CRITICAL" && !["SATISFIED", "WAIVED"].includes(r.status))
    .map((r) => `[financing condition] ${r.title}`);
}

function criticalOpenClosingItems(
  rows: Array<{ priority: string | null; status: string; title: string }>
): string[] {
  return rows
    .filter((r) => r.priority === "CRITICAL" && !["COMPLETE"].includes(r.status))
    .map((r) => `[closing checklist] ${r.title}`);
}

/**
 * Computes financing closing readiness — does not mutate deal stage or transactional closing.
 */
export async function computeClosingReadiness(pipelineDealId: string): Promise<ClosingReadinessResult> {
  const deal = await prisma.investmentPipelineDeal.findUnique({
    where: { id: pipelineDealId },
    select: {
      pipelineStage: true,
      committeeDecisions: {
        orderBy: { createdAt: "desc" },
        take: 1,
        select: { recommendation: true },
      },
    },
  });

  const financingConditions = await prisma.investmentPipelineFinancingCondition.findMany({
    where: { pipelineDealId },
    select: { title: true, priority: true, status: true },
  });

  const checklist = await prisma.investmentPipelineClosingChecklistItem.findMany({
    where: { pipelineDealId },
    select: { title: true, priority: true, status: true },
  });

  const offers = await prisma.investmentPipelineFinancingOffer.findMany({
    where: { pipelineDealId },
    select: { id: true, status: true },
  });

  const selectedOffer = offers.find((o) => o.status === "SELECTED");

  const blockers: string[] = [];
  const completedItems: string[] = [];
  const nextCriticalSteps: string[] = [];

  const latestRec = deal?.committeeDecisions[0]?.recommendation ?? null;
  const committeePositive =
    latestRec === "PROCEED" ||
    latestRec === "PROCEED_WITH_CONDITIONS";
  const stageEligible = ["APPROVED", "CONDITIONAL_APPROVAL", "EXECUTION"].includes(
    deal?.pipelineStage ?? ""
  );

  if (!(committeePositive || stageEligible)) {
    blockers.push("Committee approval / eligible execution stage not evidenced for financing close.");
    nextCriticalSteps.push("Confirm IC / committee recommendation or advance pipeline stage.");
  } else {
    completedItems.push("Decision pathway reviewed for financing readiness.");
  }

  if (!selectedOffer) {
    blockers.push("No financing offer marked SELECTED.");
    nextCriticalSteps.push("Select an indicative or formal financing offer once received.");
  } else {
    completedItems.push(`Selected offer recorded (${selectedOffer.id}).`);
  }

  const fcBlockers = criticalOpenFinancingConditions(financingConditions);
  blockers.push(...fcBlockers);
  if (fcBlockers.length > 0) {
    nextCriticalSteps.push("Clear or waive—where permitted—critical financing conditions.");
  }

  const clBlockers = criticalOpenClosingItems(checklist);
  blockers.push(...clBlockers);

  const openHigh = financingConditions.filter(
    (c) => c.priority === "HIGH" && !["SATISFIED", "WAIVED"].includes(c.status)
  );
  if (openHigh.length > 0) {
    nextCriticalSteps.push(`${openHigh.length} high-priority financing condition(s) remain open.`);
  }

  const satisfied = financingConditions.filter((c) => c.status === "SATISFIED").length;
  if (satisfied > 0) completedItems.push(`${satisfied} financing condition(s) satisfied.`);

  let readinessStatus: ClosingReadinessResult["readinessStatus"];
  if (blockers.length === 0) {
    readinessStatus = "READY";
  } else if (completedItems.length > 0 || selectedOffer || openHigh.length > 0) {
    readinessStatus = "PARTIALLY_READY";
  } else {
    readinessStatus = "NOT_READY";
  }

  logInfo(`${TAG}`, { pipelineDealId, readinessStatus, blockers: blockers.length });

  return {
    readinessStatus,
    blockers,
    completedItems,
    nextCriticalSteps,
  };
}
