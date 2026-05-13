import { randomUUID } from "node:crypto";
import type { AccountType } from "../shared/types.js";
import type { LedgerAccount } from "./types.js";

export function createLedgerAccount(input: {
  type: AccountType;
  currency: string;
  merchantId?: string;
}): LedgerAccount {
  if (!/^[A-Z]{3}$/.test(input.currency)) {
    throw new Error("Ledger account currency must be a three-letter ISO code.");
  }
  return Object.freeze({
    id: randomUUID(),
    type: input.type,
    currency: input.currency,
    ...(input.merchantId ? { merchantId: input.merchantId } : {}),
    createdAt: new Date(),
  });
}
