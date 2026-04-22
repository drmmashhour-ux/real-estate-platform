import { prisma } from "@/lib/db";
import { evaluateCompliance } from "./transaction-compliance.service";

const FINAL_STATUSES = new Set(["FINAL", "SIGNED"]);

export type ClosingGate = {
  ok: boolean;
  reasons: string[];
  financialApproved: boolean;
  documentsReady: boolean;
  notarySent: boolean;
  conditionsFulfilled: boolean;
};

function parseConditionsFulfilled(conditionsJson: unknown): boolean {
  if (conditionsJson == null) return true;
  if (!Array.isArray(conditionsJson)) return true;
  for (const item of conditionsJson) {
    if (
      item &&
      typeof item === "object" &&
      "fulfilled" in item &&
      (item as { fulfilled?: boolean }).fulfilled === false
    ) {
      return false;
    }
  }
  return true;
}

export async function assertClosingPreconditions(
  transactionId: string,
  opts?: { skipNotarySent?: boolean }
): Promise<ClosingGate> {
  const financial = await prisma.lecipmSdFinancialApproval.findUnique({ where: { transactionId } });
  const conditionsFulfilled = financial ? parseConditionsFulfilled(financial.conditionsJson) : true;

  const requiredDocs = await prisma.lecipmSdDocument.findMany({
    where: { transactionId, requiredForClosing: true },
  });
  let documentsReady = true;
  for (const d of requiredDocs) {
    if (!FINAL_STATUSES.has(d.status)) documentsReady = false;
  }

  const notary = await prisma.lecipmSdNotaryPackage.findUnique({ where: { transactionId } });
  const notarySent = opts?.skipNotarySent ? true : notary?.packageStatus === "SENT";

  const evaluation = await evaluateCompliance(transactionId, opts);
  const ok = evaluation.blockingIssues.length === 0;

  return {
    ok,
    reasons: evaluation.blockingIssues,
    financialApproved: financial?.approvalStatus === "APPROVED",
    documentsReady,
    notarySent,
    conditionsFulfilled,
  };
}

export async function closeTransactionIfAllowed(transactionId: string): Promise<{ ok: boolean; reasons: string[] }> {
  const gate = await assertClosingPreconditions(transactionId);
  if (!gate.ok) return { ok: false, reasons: gate.reasons };

  await prisma.lecipmSdTransaction.update({
    where: { id: transactionId },
    data: { status: "CLOSED" },
  });

  await prisma.lecipmSdTimelineEvent.create({
    data: {
      transactionId,
      eventType: "TRANSACTION_CLOSED",
      summary: "Transaction closed — Phase 2 + Phase 3 gates satisfied",
    },
  });

  return { ok: true, reasons: [] };
}
