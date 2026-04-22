import { prisma } from "@/lib/db";
import { logInfo } from "@/lib/logger";
import { appendAuditProof } from "./transaction-audit-proof.service";
import { logTimelineEvent } from "./transaction-timeline.service";

const TAG = "[transaction.compliance]";

export type ComplianceEvaluation = {
  blockingIssues: string[];
  warnings: string[];
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

function isLeaseTransactionType(transactionType: string): boolean {
  const u = transactionType.toUpperCase();
  return (
    u.includes("LEASE") ||
    u.includes("LOCATION") ||
    u.includes("RENTAL") ||
    u.includes("LOUER") ||
    u.includes("BAIL")
  );
}

function isPurchaseTransactionType(transactionType: string): boolean {
  const u = transactionType.toUpperCase();
  return (
    u.includes("PURCHASE") ||
    u.includes("ACHAT") ||
    u.includes("VENTE") ||
    u.includes("SALE") ||
    u.includes("BUY") ||
    u.includes("TRANSACTION ACHAT")
  );
}

/** Live compliance rules + persisted OPEN blocking checks from DB. */
export async function evaluateCompliance(
  transactionId: string,
  opts?: { skipNotarySent?: boolean }
): Promise<ComplianceEvaluation> {
  const blocking: string[] = [];
  const warnings: string[] = [];

  const txMeta = await prisma.lecipmSdTransaction.findUnique({
    where: { id: transactionId },
    select: { transactionType: true },
  });

  const parties = await prisma.lecipmSdTransactionParty.findMany({
    where: { transactionId },
    select: { role: true },
  });
  const roles = new Set(parties.map((p) => p.role));
  if (!roles.has("BUYER")) blocking.push("Missing required party: BUYER");
  if (!roles.has("SELLER")) blocking.push("Missing required party: SELLER");

  if (txMeta?.transactionType && isLeaseTransactionType(txMeta.transactionType)) {
    const okCredit = await prisma.lecipmTenantCreditCheck.findFirst({
      where: { transactionId, status: "COMPLETED", score: { not: null } },
      select: { id: true },
    });
    if (!okCredit) {
      blocking.push("Lease transaction requires completed tenant credit verification.");
    }
  }

  if (
    txMeta?.transactionType &&
    isPurchaseTransactionType(txMeta.transactionType) &&
    process.env.LECIPM_PURCHASE_CREDIT_HINT !== "false"
  ) {
    const anyCredit = await prisma.lecipmTenantCreditCheck.findFirst({
      where: { transactionId, status: "COMPLETED" },
      select: { id: true },
    });
    if (!anyCredit) {
      warnings.push("Optional: attach buyer/tenant credit verification for stronger underwriting (purchase transactions).");
    }
  }

  const financial = await prisma.lecipmSdFinancialApproval.findUnique({
    where: { transactionId },
  });
  if (!financial || financial.approvalStatus !== "APPROVED") {
    blocking.push("Financial approval must be APPROVED");
  } else if (!parseConditionsFulfilled(financial.conditionsJson)) {
    blocking.push("Financing conditions not all fulfilled");
  }

  const docs = await prisma.lecipmSdDocument.findMany({
    where: { transactionId, requiredForClosing: true },
  });
  const finalStates = new Set(["FINAL", "SIGNED"]);
  for (const d of docs) {
    if (!finalStates.has(d.status)) {
      blocking.push(`Required document not FINAL/SIGNED: ${d.title}`);
    }
    if (finalStates.has(d.status) && (!d.lockedAt || !d.immutableContentHash)) {
      warnings.push(`Required document "${d.title}" lacks immutable hash lock (Phase 3)`);
    }
  }

  const awaitingCompletion = await prisma.lecipmSdSignaturePacket.findMany({
    where: {
      transactionId,
      status: { in: ["SENT", "PARTIALLY_SIGNED"] },
    },
    select: { id: true, status: true },
  });
  for (const p of awaitingCompletion) {
    blocking.push(`Signature packet not completed (${p.status}): ${p.id}`);
  }

  const storedBlocking = await prisma.lecipmSdComplianceCheck.findMany({
    where: { transactionId, status: "OPEN", severity: "BLOCKING" },
    select: { message: true },
  });
  for (const s of storedBlocking) {
    blocking.push(`Recorded: ${s.message}`);
  }

  if (!opts?.skipNotarySent) {
    const notary = await prisma.lecipmSdNotaryPackage.findUnique({
      where: { transactionId },
      select: { packageStatus: true },
    });
    if (notary?.packageStatus !== "SENT") {
      blocking.push("Notary package must be SENT");
    }
  }

  const storedWarnings = await prisma.lecipmSdComplianceCheck.findMany({
    where: { transactionId, status: "OPEN", severity: "WARNING" },
    select: { message: true },
  });
  for (const s of storedWarnings) {
    warnings.push(`Recorded: ${s.message}`);
  }

  logInfo(TAG, { transactionId, blocking: blocking.length, warnings: warnings.length });

  return {
    blockingIssues: [...new Set(blocking)],
    warnings: [...new Set(warnings)],
  };
}

export async function recordComplianceFinding(input: {
  transactionId: string;
  documentId?: string | null;
  checkType: string;
  severity: "WARNING" | "BLOCKING";
  message: string;
}) {
  const row = await prisma.lecipmSdComplianceCheck.create({
    data: {
      transactionId: input.transactionId,
      documentId: input.documentId ?? undefined,
      checkType: input.checkType.slice(0, 40),
      severity: input.severity,
      status: "OPEN",
      message: input.message.slice(0, 8000),
    },
  });

  await appendAuditProof({
    transactionId: input.transactionId,
    documentId: input.documentId,
    eventType: "COMPLIANCE_CHECK_FAILED",
    payload: { checkId: row.id, checkType: input.checkType, severity: input.severity },
  });
  await logTimelineEvent(
    prisma,
    input.transactionId,
    "COMPLIANCE_CHECK_FAILED",
    `${input.severity}: ${input.message}`
  );
  logInfo(TAG, { action: "recordFinding", id: row.id });
  return row;
}

/** Resolve all OPEN compliance rows for a given `checkType` (e.g. TENANT_CREDIT_PENDING). */
export async function resolveComplianceChecksByType(transactionId: string, checkType: string): Promise<number> {
  const r = await prisma.lecipmSdComplianceCheck.updateMany({
    where: { transactionId, checkType: checkType.slice(0, 40), status: "OPEN" },
    data: { status: "RESOLVED" },
  });
  return r.count;
}

export async function resolveComplianceCheck(checkId: string, transactionId: string) {
  const row = await prisma.lecipmSdComplianceCheck.findFirst({
    where: { id: checkId, transactionId },
  });
  if (!row) throw new Error("Compliance check not found");

  await prisma.lecipmSdComplianceCheck.update({
    where: { id: checkId },
    data: { status: "RESOLVED" },
  });

  await appendAuditProof({
    transactionId,
    documentId: row.documentId,
    eventType: "COMPLIANCE_RESOLVED",
    payload: { checkId },
  });
  await logTimelineEvent(prisma, transactionId, "COMPLIANCE_RESOLVED", `Resolved check ${checkId}`);
  return row;
}
