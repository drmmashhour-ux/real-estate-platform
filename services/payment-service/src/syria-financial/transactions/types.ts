import { z } from "zod";
import { providerMetadataSchema, syriaPaymentProviderIdSchema } from "../providers/types.js";

export const SYRIA_TRANSACTION_STATUSES = [
  "pending",
  "authorized",
  "processing",
  "completed",
  "failed",
  "refunded",
  "cancelled",
  "disputed",
] as const;

export const syriaTransactionStatusSchema = z.enum(SYRIA_TRANSACTION_STATUSES);
export type SyriaTransactionStatus = z.infer<typeof syriaTransactionStatusSchema>;

export const transactionActorSchema = z.object({
  actorType: z.enum(["system", "payer", "merchant", "admin", "provider"]),
  actorId: z.string().trim().min(1).optional(),
});

export const transactionAuditEntrySchema = z.object({
  action: z.string().trim().min(1),
  actor: transactionActorSchema,
  correlationId: z.string().trim().min(1),
  occurredAt: z.date(),
  details: providerMetadataSchema,
});

export const createTransactionSchema = z.object({
  provider: syriaPaymentProviderIdSchema,
  amount: z.object({
    amountMinor: z.number().int().positive(),
    currency: z.string().trim().length(3).transform((value) => value.toUpperCase()),
  }),
  bookingId: z.string().uuid(),
  payerId: z.string().uuid(),
  merchantId: z.string().uuid(),
  idempotencyKey: z.string().trim().min(16).max(128),
  metadata: providerMetadataSchema,
  correlationId: z.string().trim().min(1),
  actor: transactionActorSchema,
});

export type TransactionAuditEntry = z.infer<typeof transactionAuditEntrySchema>;
export type CreateSyriaTransactionInput = z.infer<typeof createTransactionSchema>;

export interface SyriaFinancialTransaction {
  id: string;
  provider: CreateSyriaTransactionInput["provider"];
  amount: CreateSyriaTransactionInput["amount"];
  bookingId: string;
  payerId: string;
  merchantId: string;
  status: SyriaTransactionStatus;
  idempotencyKey: string;
  createdAt: Date;
  updatedAt: Date;
  metadata: Readonly<CreateSyriaTransactionInput["metadata"]>;
  auditTrail: readonly TransactionAuditEntry[];
}
