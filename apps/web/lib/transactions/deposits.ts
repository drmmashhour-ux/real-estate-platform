import { prisma } from "@/lib/db";
import { recordTransactionEvent } from "./events";
import type { DepositPaymentStatus } from "./constants";

export interface RecordDepositInput {
  transactionId: string;
  amount: number; // cents
  paymentProvider: string;
  paymentStatus: DepositPaymentStatus;
  externalRef?: string | null;
}

export async function recordDeposit(input: RecordDepositInput): Promise<{ depositId: string }> {
  const tx = await prisma.realEstateTransaction.findUnique({
    where: { id: input.transactionId },
    select: { id: true, status: true },
  });
  if (!tx) throw new Error("Transaction not found");
  if (!["offer_accepted", "deposit_required", "deposit_received"].includes(tx.status)) {
    throw new Error("Transaction is not in a state to record deposit");
  }

  const deposit = await prisma.transactionDeposit.create({
    data: {
      transactionId: input.transactionId,
      amount: input.amount,
      paymentProvider: input.paymentProvider,
      paymentStatus: input.paymentStatus,
      externalRef: input.externalRef ?? undefined,
    },
  });

  if (input.paymentStatus === "paid") {
    await prisma.realEstateTransaction.update({
      where: { id: input.transactionId },
      data: { status: "deposit_received" },
    });
    await recordTransactionEvent(input.transactionId, "deposit_paid", {
      depositId: deposit.id,
      amount: input.amount,
    }, null);
  }

  return { depositId: deposit.id };
}

export async function markDepositRefunded(depositId: string): Promise<void> {
  const deposit = await prisma.transactionDeposit.findUnique({
    where: { id: depositId },
    select: { transactionId: true, paymentStatus: true },
  });
  if (!deposit) throw new Error("Deposit not found");
  if (deposit.paymentStatus !== "paid") throw new Error("Deposit is not paid");

  await prisma.transactionDeposit.update({
    where: { id: depositId },
    data: { paymentStatus: "refunded" },
  });
  await recordTransactionEvent(deposit.transactionId, "deposit_refunded", { depositId }, null);
}
