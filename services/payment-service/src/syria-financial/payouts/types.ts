import { z } from "zod";
import { providerMetadataSchema, syriaPaymentProviderIdSchema } from "../providers/types.js";

export const SYRIA_PAYOUT_STATUSES = ["pending", "processing", "completed", "failed", "cancelled"] as const;
export const syriaPayoutStatusSchema = z.enum(SYRIA_PAYOUT_STATUSES);

export const createPayoutPreparationSchema = z.object({
  merchantId: z.string().uuid(),
  provider: syriaPaymentProviderIdSchema,
  amount: z.object({
    amountMinor: z.number().int().positive(),
    currency: z.string().trim().length(3).transform((value) => value.toUpperCase()),
  }),
  idempotencyKey: z.string().trim().min(16).max(128),
  correlationId: z.string().trim().min(1),
  metadata: providerMetadataSchema,
});

export type SyriaPayoutStatus = z.infer<typeof syriaPayoutStatusSchema>;
export type CreatePayoutPreparationInput = z.infer<typeof createPayoutPreparationSchema>;

export interface SyriaPayoutPreparation {
  id: string;
  merchantId: string;
  provider: CreatePayoutPreparationInput["provider"];
  amount: CreatePayoutPreparationInput["amount"];
  status: SyriaPayoutStatus;
  idempotencyKey: string;
  correlationId: string;
  metadata: Readonly<CreatePayoutPreparationInput["metadata"]>;
  liveTransferExecuted: false;
  createdAt: Date;
}
