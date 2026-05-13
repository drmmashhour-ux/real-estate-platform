import { z } from "zod";

export const walletBalancesSchema = z.object({
  availableBalanceMinor: z.number().int().min(0).default(0),
  pendingBalanceMinor: z.number().int().min(0).default(0),
  payoutBalanceMinor: z.number().int().min(0).default(0),
  refundBalanceMinor: z.number().int().min(0).default(0),
  holdBalanceMinor: z.number().int().min(0).default(0),
});

export const walletTransactionReferenceSchema = z.object({
  transactionId: z.string().uuid(),
  bookingId: z.string().uuid().optional(),
  providerReference: z.string().trim().min(1).optional(),
});

export type SyriaWalletBalances = z.infer<typeof walletBalancesSchema>;
export type SyriaWalletTransactionReference = z.infer<typeof walletTransactionReferenceSchema>;

export interface SyriaWalletSnapshot {
  walletId: string;
  ownerId: string;
  currency: string;
  balances: Readonly<SyriaWalletBalances>;
  immutableTransactionReferences: readonly SyriaWalletTransactionReference[];
  createdAt: Date;
  updatedAt: Date;
  publicExposureAllowed: false;
}
