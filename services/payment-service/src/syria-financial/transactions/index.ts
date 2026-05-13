import { randomUUID } from "node:crypto";
import { z } from "zod";
import { FinancialError } from "../common/errors.js";
import {
  auditTrailEntrySchema,
  financialCurrencySchema,
  financialIdSchema,
  financialMetadataSchema,
  freezeFinancialRecord,
  nowIso,
  requestCorrelationSchema,
  syriaProviderCodeSchema,
  type AuditTrailEntry,
  type FinancialActor,
  type FinancialMetadata,
  type RequestCorrelation,
} from "../common/types.js";
import { assertNoRawCardData, sanitizeFinancialMetadata } from "../common/security.js";

export const syriaTransactionStatuses = [
  "pending",
  "authorized",
  "processing",
  "completed",
  "failed",
  "refunded",
  "cancelled",
  "disputed",
] as const;

export const syriaTransactionStatusSchema = z.enum(syriaTransactionStatuses);
export type SyriaTransactionStatus = z.infer<typeof syriaTransactionStatusSchema>;

const allowedStatusTransitions: Record<SyriaTransactionStatus, readonly SyriaTransactionStatus[]> = {
  pending: ["authorized", "processing", "failed", "cancelled"],
  authorized: ["processing", "completed", "failed", "refunded", "cancelled", "disputed"],
  processing: ["completed", "failed", "cancelled", "disputed"],
  completed: ["refunded", "disputed"],
  failed: [],
  refunded: ["disputed"],
  cancelled: [],
  disputed: ["refunded", "completed"],
};

export const syriaTransactionSchema = z.object({
  id: financialIdSchema,
  provider: syriaProviderCodeSchema,
  amount: z.number().int().positive(),
  currency: financialCurrencySchema,
  bookingId: financialIdSchema,
  payerId: financialIdSchema,
  merchantId: financialIdSchema,
  status: syriaTransactionStatusSchema,
  idempotencyKey: financialIdSchema.optional(),
  retry: z.object({
    attempt: z.number().int().min(0),
    maxAttempts: z.number().int().min(0),
    nextRetryAt: z.string().datetime({ offset: true }).optional(),
  }),
  timestamps: z.object({
    createdAt: z.string().datetime({ offset: true }),
    updatedAt: z.string().datetime({ offset: true }),
    completedAt: z.string().datetime({ offset: true }).optional(),
  }),
  metadata: financialMetadataSchema,
  auditTrail: z.array(auditTrailEntrySchema),
});

export type SyriaTransaction = z.infer<typeof syriaTransactionSchema>;

export interface CreateSyriaTransactionInput {
  provider: SyriaTransaction["provider"];
  amount: number;
  currency: string;
  bookingId: string;
  payerId: string;
  merchantId: string;
  idempotencyKey?: string;
  metadata?: FinancialMetadata;
  actor: FinancialActor;
  correlation: RequestCorrelation;
}

export function createSyriaTransaction(input: CreateSyriaTransactionInput): Readonly<SyriaTransaction> {
  const timestamp = nowIso();
  const metadata = financialMetadataSchema.parse(input.metadata ?? {});
  assertNoRawCardData(metadata);

  const auditEntry: AuditTrailEntry = {
    id: randomUUID(),
    action: "transaction.created",
    actor: input.actor,
    occurredAt: timestamp,
    correlationId: input.correlation.correlationId,
    metadata: sanitizeFinancialMetadata(metadata),
  };

  const transaction = syriaTransactionSchema.parse({
    id: randomUUID(),
    provider: input.provider,
    amount: input.amount,
    currency: input.currency,
    bookingId: input.bookingId,
    payerId: input.payerId,
    merchantId: input.merchantId,
    status: "pending",
    idempotencyKey: input.idempotencyKey,
    retry: { attempt: 0, maxAttempts: 3 },
    timestamps: { createdAt: timestamp, updatedAt: timestamp },
    metadata: sanitizeFinancialMetadata(metadata),
    auditTrail: [auditEntry],
  });

  return freezeFinancialRecord(transaction);
}

export function transitionSyriaTransaction(
  transaction: SyriaTransaction,
  nextStatus: SyriaTransactionStatus,
  actor: FinancialActor,
  correlation: RequestCorrelation,
  metadata: FinancialMetadata = {},
): Readonly<SyriaTransaction> {
  requestCorrelationSchema.parse(correlation);
  const parsedMetadata = financialMetadataSchema.parse(metadata);
  assertNoRawCardData(parsedMetadata);

  const allowed = allowedStatusTransitions[transaction.status];
  if (!allowed.includes(nextStatus)) {
    throw new FinancialError(
      "INVALID_STATE_TRANSITION",
      `Cannot transition Syria transaction from ${transaction.status} to ${nextStatus}.`,
      409,
      correlation,
    );
  }

  const timestamp = nowIso();
  return freezeFinancialRecord(
    syriaTransactionSchema.parse({
      ...transaction,
      status: nextStatus,
      timestamps: {
        ...transaction.timestamps,
        updatedAt: timestamp,
        completedAt:
          nextStatus === "completed" || nextStatus === "failed" || nextStatus === "cancelled"
            ? timestamp
            : transaction.timestamps.completedAt,
      },
      auditTrail: [
        ...transaction.auditTrail,
        {
          id: randomUUID(),
          action: `transaction.status.${nextStatus}`,
          actor,
          occurredAt: timestamp,
          correlationId: correlation.correlationId,
          metadata: sanitizeFinancialMetadata(parsedMetadata),
        },
      ],
    }),
  );
}
