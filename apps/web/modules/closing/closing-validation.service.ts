import { prisma } from "@/lib/db";
import { evaluateCompliance } from "@/modules/transactions/transaction-compliance.service";
import type { ClosingValidationResult } from "./closing.types";

/** Full closing gate before `completeClosing`. */
export async function evaluateClosing(dealId: string): Promise<ClosingValidationResult> {
  const issues: string[] = [];

  const deal = await prisma.lecipmPipelineDeal.findUnique({
    where: { id: dealId },
    select: { pipelineStage: true, transactionId: true },
  });
  if (!deal) {
    return { status: "BLOCKED", issues: ["Deal not found"] };
  }

  if (deal.pipelineStage !== "EXECUTION") {
    issues.push(`Deal must be in EXECUTION stage (current: ${deal.pipelineStage})`);
  }

  const closing = await prisma.lecipmPipelineDealClosing.findUnique({
    where: { dealId },
    include: {
      checklistItems: true,
      closingDocuments: true,
    },
  });

  if (!closing) {
    issues.push("Closing room not initialized");
    return { status: "BLOCKED", issues };
  }

  const critOpenFin = await prisma.lecipmPipelineDealFinancingCondition.count({
    where: {
      dealId,
      isCritical: true,
      status: { notIn: ["SATISFIED", "WAIVED"] },
    },
  });
  if (critOpenFin > 0) {
    issues.push(`${critOpenFin} critical financing condition(s) still open`);
  }

  if (deal.transactionId) {
    const awaitingPackets = await prisma.lecipmSdSignaturePacket.count({
      where: {
        transactionId: deal.transactionId,
        status: { in: ["SENT", "PARTIALLY_SIGNED"] },
      },
    });
    if (awaitingPackets > 0) {
      issues.push(`Incomplete signature packets: ${awaitingPackets}`);
    }

    const compliance = await evaluateCompliance(deal.transactionId);
    for (const m of compliance.blockingIssues) {
      issues.push(`Compliance: ${m}`);
    }
  } else {
    issues.push("Transaction not linked — cannot validate signatures/compliance");
  }

  const criticalBlocked = closing.checklistItems.filter((i) => i.isCritical && i.status !== "DONE");
  if (criticalBlocked.length > 0) {
    issues.push(`${criticalBlocked.length} critical checklist item(s) not DONE`);
  }

  const unverified = closing.closingDocuments.filter((d) => d.status !== "VERIFIED");
  if (unverified.length > 0) {
    issues.push(`${unverified.length} closing document(s) not VERIFIED`);
  }

  if (closing.closingDocuments.length === 0) {
    issues.push("No closing documents registered");
  }

  return issues.length === 0 ? { status: "READY", issues: [] } : { status: "BLOCKED", issues };
}
