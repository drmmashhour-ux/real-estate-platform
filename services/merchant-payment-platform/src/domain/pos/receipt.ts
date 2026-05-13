import { randomUUID } from "node:crypto";
import type { PaymentTransaction } from "../transactions/types.js";

export interface Receipt {
  id: string;
  transactionId: string;
  merchantId: string;
  amountMinor: number;
  currency: string;
  providerReference?: string;
  issuedAt: Date;
  liveExecution: false;
}

export function issueReceipt(transaction: PaymentTransaction): Receipt {
  if (transaction.status !== "recorded" && transaction.status !== "settled" && transaction.status !== "completed") {
    throw new Error("Receipt can only be issued after ledger recording.");
  }
  return Object.freeze({
    id: randomUUID(),
    transactionId: transaction.id,
    merchantId: transaction.merchantId,
    amountMinor: transaction.money.amountMinor,
    currency: transaction.money.currency,
    ...(transaction.providerReference ? { providerReference: transaction.providerReference } : {}),
    issuedAt: new Date(),
    liveExecution: false,
  });
}
