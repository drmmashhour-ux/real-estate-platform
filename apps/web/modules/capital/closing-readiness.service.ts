import { prisma } from "@/lib/db";
import { logInfo } from "@/lib/logger";
import { evaluateCompliance } from "@/modules/transactions/transaction-compliance.service";
import { appendDealAuditEvent } from "@/modules/deals/deal-audit.service";
import type { ClosingBlocker, ClosingReadinessLabel } from "./capital.types";
import { logDealCapitalTimeline } from "./capital-timeline.service";

const TAG = "[capital.closing-readiness]";

export async function evaluateClosingReadiness(dealId: string, actorUserId: string | null) {
  const deal = await prisma.lecipmPipelineDeal.findUnique({
    where: { id: dealId },
    select: { id: true, transactionId: true },
  });
  if (!deal) throw new Error("Deal not found");

  const blockers: ClosingBlocker[] = [];
  const warnings: string[] = [];

  const pipeCriticalOpen = await prisma.lecipmPipelineDealCondition.count({
    where: {
      dealId,
      priority: "CRITICAL",
      status: { in: ["OPEN", "IN_PROGRESS", "FAILED"] },
    },
  });
  if (pipeCriticalOpen > 0) {
    blockers.push({
      code: "PIPELINE_CONDITION_CRITICAL",
      severity: "CRITICAL",
      message: `${pipeCriticalOpen} critical pipeline condition(s) not cleared`,
    });
  }

  const financingCriticalOpen = await prisma.lecipmPipelineDealFinancingCondition.count({
    where: {
      dealId,
      isCritical: true,
      status: { notIn: ["SATISFIED", "WAIVED"] },
    },
  });
  if (financingCriticalOpen > 0) {
    blockers.push({
      code: "FINANCING_CONDITION_CRITICAL",
      severity: "CRITICAL",
      message: `${financingCriticalOpen} critical financing condition(s) open`,
    });
  }

  if (deal.transactionId) {
    const ev = await evaluateCompliance(deal.transactionId);
    for (const m of ev.blockingIssues) {
      blockers.push({ code: "TRANSACTION_COMPLIANCE", severity: "CRITICAL", message: m });
    }
    for (const w of ev.warnings) warnings.push(w);
  }

  const pipeNonCriticalOpen = await prisma.lecipmPipelineDealCondition.count({
    where: {
      dealId,
      priority: { not: "CRITICAL" },
      status: { in: ["OPEN", "IN_PROGRESS"] },
    },
  });

  const financingNonCriticalOpen = await prisma.lecipmPipelineDealFinancingCondition.count({
    where: {
      dealId,
      isCritical: false,
      status: { notIn: ["SATISFIED", "WAIVED", "FAILED"] },
    },
  });

  let readinessStatus: ClosingReadinessLabel = "BLOCKED";
  if (blockers.length > 0) {
    readinessStatus = "BLOCKED";
  } else if (warnings.length > 0 || pipeNonCriticalOpen > 0 || financingNonCriticalOpen > 0) {
    readinessStatus = "CONDITIONAL";
  } else {
    readinessStatus = "READY";
  }

  const prev = await prisma.lecipmPipelineDealClosingReadiness.findUnique({ where: { dealId } });

  const row = await prisma.lecipmPipelineDealClosingReadiness.upsert({
    where: { dealId },
    create: {
      dealId,
      readinessStatus,
      blockingItemsJson: [...blockers, ...warnings.map((w) => ({ code: "WARNING", severity: "WARNING" as const, message: w }))],
      lastEvaluatedAt: new Date(),
    },
    update: {
      readinessStatus,
      blockingItemsJson: [...blockers, ...warnings.map((w) => ({ code: "WARNING", severity: "WARNING" as const, message: w }))],
      lastEvaluatedAt: new Date(),
    },
  });

  await appendDealAuditEvent(prisma, {
    dealId,
    eventType: "CLOSING_READINESS_EVALUATED",
    actorUserId,
    summary: `Closing readiness: ${readinessStatus}`,
    metadataJson: { blockerCount: blockers.length },
  });

  if (readinessStatus === "READY" && prev?.readinessStatus !== "READY") {
    await logDealCapitalTimeline(dealId, "CLOSING_READY", "Pre-notary closing readiness satisfied");
    await appendDealAuditEvent(prisma, {
      dealId,
      eventType: "CLOSING_READY",
      actorUserId,
      summary: "Closing readiness READY (pre-notary)",
    });
  }

  logInfo(TAG, { dealId, readinessStatus });
  return { row, blockers, warnings, readinessStatus };
}

export async function getStoredClosingReadiness(dealId: string) {
  return prisma.lecipmPipelineDealClosingReadiness.findUnique({ where: { dealId } });
}
