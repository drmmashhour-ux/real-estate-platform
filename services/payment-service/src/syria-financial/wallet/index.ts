import { randomUUID } from "node:crypto";
import { z } from "zod";
import { FinancialError } from "../common/errors.js";
import {
  financialCurrencySchema,
  financialIdSchema,
  financialMetadataSchema,
  freezeFinancialRecord,
  nowIso,
  type FinancialMetadata,
  type RequestCorrelation,
} from "../common/types.js";
import { sanitizeFinancialMetadata } from "../common/security.js";

export const walletBalanceSchema = z.object({
  available: z.number().int().min(0),
  pending: z.number().int().min(0),
  payout: z.number().int().min(0),
  refund: z.number().int().min(0),
  hold: z.number().int().min(0),
});

export const walletLedgerEntrySchema = z.object({
  id: financialIdSchema,
  immutableTransactionId: financialIdSchema,
  referenceType: z.enum(["transaction", "payout", "refund", "manual_review"]),
  referenceId: financialIdSchema,
  balanceDelta: walletBalanceSchema.partial(),
  correlationId: financialIdSchema,
  metadata: financialMetadataSchema,
  createdAt: z.string().datetime({ offset: true }),
});

export const syriaWalletSchema = z.object({
  id: financialIdSchema,
  merchantId: financialIdSchema,
  currency: financialCurrencySchema,
  balances: walletBalanceSchema,
  ledger: z.array(walletLedgerEntrySchema),
  createdAt: z.string().datetime({ offset: true }),
  updatedAt: z.string().datetime({ offset: true }),
  deletedAt: z.string().datetime({ offset: true }).optional(),
});

export type SyriaWallet = z.infer<typeof syriaWalletSchema>;
export type SyriaWalletLedgerEntry = z.infer<typeof walletLedgerEntrySchema>;

export function createSyriaWallet(merchantId: string, currency = "SYP"): Readonly<SyriaWallet> {
  const timestamp = nowIso();
  return freezeFinancialRecord(
    syriaWalletSchema.parse({
      id: randomUUID(),
      merchantId,
      currency,
      balances: {
        available: 0,
        pending: 0,
        payout: 0,
        refund: 0,
        hold: 0,
      },
      ledger: [],
      createdAt: timestamp,
      updatedAt: timestamp,
    }),
  );
}

export interface ApplyLedgerEntryInput {
  immutableTransactionId: string;
  referenceType: SyriaWalletLedgerEntry["referenceType"];
  referenceId: string;
  balanceDelta: Partial<SyriaWallet["balances"]>;
  metadata?: FinancialMetadata;
  correlation: RequestCorrelation;
}

export function applySyriaWalletLedgerEntry(
  wallet: SyriaWallet,
  input: ApplyLedgerEntryInput,
): Readonly<SyriaWallet> {
  if (wallet.ledger.some((entry) => entry.immutableTransactionId === input.immutableTransactionId)) {
    throw new FinancialError(
      "IDEMPOTENCY_CONFLICT",
      "Wallet ledger already contains this immutable transaction reference.",
      409,
      input.correlation,
    );
  }

  const nextBalances = { ...wallet.balances };
  for (const [key, delta] of Object.entries(input.balanceDelta)) {
    const balanceKey = key as keyof SyriaWallet["balances"];
    const nextValue = nextBalances[balanceKey] + (delta ?? 0);
    if (nextValue < 0) {
      throw new FinancialError("VALIDATION_ERROR", `Wallet ${balanceKey} balance cannot be negative.`, 400);
    }
    nextBalances[balanceKey] = nextValue;
  }

  const timestamp = nowIso();
  const ledgerEntry = walletLedgerEntrySchema.parse({
    id: randomUUID(),
    immutableTransactionId: input.immutableTransactionId,
    referenceType: input.referenceType,
    referenceId: input.referenceId,
    balanceDelta: input.balanceDelta,
    correlationId: input.correlation.correlationId,
    metadata: sanitizeFinancialMetadata(financialMetadataSchema.parse(input.metadata ?? {})),
    createdAt: timestamp,
  });

  return freezeFinancialRecord(
    syriaWalletSchema.parse({
      ...wallet,
      balances: nextBalances,
      ledger: [...wallet.ledger, ledgerEntry],
      updatedAt: timestamp,
    }),
  );
}

export function toPublicWalletPreview(wallet: SyriaWallet): Pick<SyriaWallet, "id" | "merchantId" | "currency"> {
  return {
    id: wallet.id,
    merchantId: wallet.merchantId,
    currency: wallet.currency,
  };
}
