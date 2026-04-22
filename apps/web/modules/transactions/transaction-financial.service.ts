import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { logInfo } from "@/lib/logger";
import { appendAuditProof } from "./transaction-audit-proof.service";
import { logTimelineEvent } from "./transaction-timeline.service";

const TAG = "[transaction.financial]";

export async function createOrGetFinancial(transactionId: string) {
  const existing = await prisma.lecipmSdFinancialApproval.findUnique({ where: { transactionId } });
  if (existing) return existing;

  const row = await prisma.lecipmSdFinancialApproval.create({
    data: { transactionId },
  });
  await logTimelineEvent(prisma, transactionId, "FINANCIAL_SUBMITTED", "Financial approval file opened");
  logInfo(`${TAG}`, { transactionId, action: "create" });
  return row;
}

export async function updateFinancialApproval(input: {
  transactionId: string;
  lenderName?: string | null;
  brokerName?: string | null;
  approvalStatus: string;
  approvedAmount?: number | null;
  interestRate?: number | null;
  conditionsJson?: Prisma.InputJsonValue | null;
  approvalDate?: Date | null;
}) {
  const row = await prisma.lecipmSdFinancialApproval.upsert({
    where: { transactionId: input.transactionId },
    create: {
      transactionId: input.transactionId,
      lenderName: input.lenderName ?? null,
      brokerName: input.brokerName ?? null,
      approvalStatus: input.approvalStatus.slice(0, 24),
      approvedAmount: input.approvedAmount ?? null,
      interestRate: input.interestRate ?? null,
      conditionsJson: input.conditionsJson ?? undefined,
      approvalDate: input.approvalDate ?? null,
    },
    update: {
      lenderName: input.lenderName ?? undefined,
      brokerName: input.brokerName ?? undefined,
      approvalStatus: input.approvalStatus.slice(0, 24),
      approvedAmount: input.approvedAmount ?? undefined,
      interestRate: input.interestRate ?? undefined,
      conditionsJson: input.conditionsJson ?? undefined,
      approvalDate: input.approvalDate ?? undefined,
    },
  });

  if (input.approvalStatus === "APPROVED") {
    await logTimelineEvent(prisma, input.transactionId, "FINANCIAL_APPROVED", "Financing marked APPROVED");
    await appendAuditProof({
      transactionId: input.transactionId,
      eventType: "FINANCIAL_APPROVED",
      payload: { approvalStatus: "APPROVED" },
    });
  } else if (input.approvalStatus === "REJECTED") {
    await logTimelineEvent(prisma, input.transactionId, "FINANCIAL_REJECTED", "Financing marked REJECTED");
  }

  logInfo(`${TAG}`, { transactionId: input.transactionId, status: row.approvalStatus });
  return row;
}

export async function getFinancial(transactionId: string) {
  return prisma.lecipmSdFinancialApproval.findUnique({ where: { transactionId } });
}
