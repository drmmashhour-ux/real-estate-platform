import { randomUUID } from "node:crypto";
import { SyriaFinancialError } from "../errors.js";
import { redactFinancialSecrets } from "../security.js";
import {
  createTransactionSchema,
  syriaTransactionStatusSchema,
  type CreateSyriaTransactionInput,
  type SyriaFinancialTransaction,
  type SyriaTransactionStatus,
  type TransactionAuditEntry,
} from "./types.js";

const ALLOWED_TRANSITIONS: Record<SyriaTransactionStatus, readonly SyriaTransactionStatus[]> = {
  pending: ["authorized", "processing", "failed", "cancelled"],
  authorized: ["processing", "completed", "failed", "cancelled", "disputed"],
  processing: ["completed", "failed", "cancelled", "disputed"],
  completed: ["refunded", "disputed"],
  failed: [],
  refunded: ["disputed"],
  cancelled: [],
  disputed: ["refunded", "failed"],
};

export function createPreparedSyriaTransaction(
  input: CreateSyriaTransactionInput,
  now: Date = new Date(),
): SyriaFinancialTransaction {
  const parsed = createTransactionSchema.safeParse(input);
  if (!parsed.success) {
    throw new SyriaFinancialError(
      "VALIDATION_ERROR",
      parsed.error.issues[0]?.message ?? "Invalid Syria transaction payload.",
      { statusCode: 400 },
    );
  }

  const auditEntry: TransactionAuditEntry = {
    action: "transaction.prepared",
    actor: parsed.data.actor,
    correlationId: parsed.data.correlationId,
    occurredAt: now,
    details: redactFinancialSecrets(parsed.data.metadata) as Record<string, string | number | boolean>,
  };

  return {
    id: randomUUID(),
    provider: parsed.data.provider,
    amount: parsed.data.amount,
    bookingId: parsed.data.bookingId,
    payerId: parsed.data.payerId,
    merchantId: parsed.data.merchantId,
    status: "pending",
    idempotencyKey: parsed.data.idempotencyKey,
    createdAt: now,
    updatedAt: now,
    metadata: Object.freeze({ ...parsed.data.metadata }),
    auditTrail: Object.freeze([auditEntry]),
  };
}

export function transitionSyriaTransaction(
  transaction: SyriaFinancialTransaction,
  nextStatus: SyriaTransactionStatus,
  auditEntry: TransactionAuditEntry,
): SyriaFinancialTransaction {
  const parsedStatus = syriaTransactionStatusSchema.parse(nextStatus);
  if (!ALLOWED_TRANSITIONS[transaction.status].includes(parsedStatus)) {
    throw new SyriaFinancialError(
      "UNSUPPORTED_STATUS_TRANSITION",
      `Cannot transition Syria transaction from ${transaction.status} to ${parsedStatus}.`,
      { statusCode: 409, correlationId: auditEntry.correlationId },
    );
  }

  return {
    ...transaction,
    status: parsedStatus,
    updatedAt: auditEntry.occurredAt,
    auditTrail: Object.freeze([...transaction.auditTrail, auditEntry]),
  };
}
