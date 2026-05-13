import { randomUUID } from "node:crypto";
import { SYRIA_FINANCIAL_DEFAULT_CURRENCY } from "../constants.js";
import {
  walletBalancesSchema,
  walletTransactionReferenceSchema,
  type SyriaWalletSnapshot,
  type SyriaWalletTransactionReference,
} from "./types.js";

export function createSyriaWalletSnapshot(input: {
  ownerId: string;
  currency?: string;
  createdAt?: Date;
}): SyriaWalletSnapshot {
  const now = input.createdAt ?? new Date();
  return {
    walletId: randomUUID(),
    ownerId: input.ownerId,
    currency: (input.currency ?? SYRIA_FINANCIAL_DEFAULT_CURRENCY).toUpperCase(),
    balances: Object.freeze(walletBalancesSchema.parse({})),
    immutableTransactionReferences: Object.freeze([]),
    createdAt: now,
    updatedAt: now,
    publicExposureAllowed: false,
  };
}

export function attachImmutableWalletTransactionReference(
  wallet: SyriaWalletSnapshot,
  reference: SyriaWalletTransactionReference,
  updatedAt: Date = new Date(),
): SyriaWalletSnapshot {
  const parsedReference = walletTransactionReferenceSchema.parse(reference);
  return {
    ...wallet,
    updatedAt,
    immutableTransactionReferences: Object.freeze([
      ...wallet.immutableTransactionReferences,
      Object.freeze(parsedReference),
    ]),
  };
}
