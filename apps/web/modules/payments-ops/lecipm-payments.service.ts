import type { LecipmPaymentKind, Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { appendLedgerEntry } from "./payment-ledger.service";
import { transitionPaymentStatus } from "./payment-state-machine.service";
import { logPaymentOpsEvent } from "./payments-ops-audit.service";

export async function listDealPayments(dealId: string) {
  return prisma.lecipmDealPayment.findMany({
    where: { dealId },
    orderBy: { createdAt: "desc" },
    include: { instructions: true, confirmations: true },
  });
}

export async function createDealPayment(input: {
  dealId: string;
  paymentKind: LecipmPaymentKind;
  amountCents: number;
  currency?: string;
  provider: string;
  dueAt?: Date | null;
  metadata?: Record<string, unknown>;
  actorUserId: string;
}) {
  const pay = await prisma.lecipmDealPayment.create({
    data: {
      dealId: input.dealId,
      paymentKind: input.paymentKind,
      status: "draft",
      amountCents: input.amountCents,
      currency: input.currency ?? "cad",
      provider: input.provider,
      dueAt: input.dueAt ?? null,
      metadata: (input.metadata ?? {}) as Prisma.InputJsonValue,
    },
  });
  await appendLedgerEntry({
    dealId: input.dealId,
    paymentId: pay.id,
    entryKind: "request_created",
    amountCents: input.amountCents,
    description: `Payment draft created (${input.paymentKind})`,
    actorUserId: input.actorUserId,
  });
  await logPaymentOpsEvent(input.dealId, "payment_created", { paymentId: pay.id }, input.actorUserId);
  return pay;
}

export async function requestPayment(input: { dealId: string; paymentId: string; actorUserId: string }) {
  return transitionPaymentStatus({
    paymentId: input.paymentId,
    dealId: input.dealId,
    to: "requested",
    actorUserId: input.actorUserId,
  });
}

export async function getTrustWorkflow(dealId: string) {
  return prisma.lecipmTrustWorkflow.findUnique({ where: { dealId } });
}

export async function upsertTrustWorkflow(input: {
  dealId: string;
  mode: import("@prisma/client").LecipmTrustWorkflowMode;
  status?: import("@prisma/client").LecipmTrustWorkflowStatus;
  trusteeName?: string | null;
  trusteeType?: string | null;
  trustAccountReference?: string | null;
  notes?: Prisma.InputJsonValue;
  actorUserId: string;
}) {
  const row = await prisma.lecipmTrustWorkflow.upsert({
    where: { dealId: input.dealId },
    create: {
      dealId: input.dealId,
      mode: input.mode,
      status: input.status ?? "profiled",
      trusteeName: input.trusteeName ?? undefined,
      trusteeType: input.trusteeType ?? undefined,
      trustAccountReference: input.trustAccountReference ?? undefined,
      notes: (input.notes ?? []) as Prisma.InputJsonValue,
    },
    update: {
      mode: input.mode,
      status: input.status ?? undefined,
      trusteeName: input.trusteeName ?? undefined,
      trusteeType: input.trusteeType ?? undefined,
      trustAccountReference: input.trustAccountReference ?? undefined,
      notes: input.notes !== undefined ? (input.notes as Prisma.InputJsonValue) : undefined,
    },
  });
  await logPaymentOpsEvent(input.dealId, "trust_workflow_upserted", { mode: input.mode }, input.actorUserId);
  return row;
}
