import { randomUUID } from "node:crypto";
import { z } from "zod";
import {
  financialActorSchema,
  financialIdSchema,
  financialMetadataSchema,
  freezeFinancialRecord,
  nowIso,
  type FinancialActor,
  type FinancialMetadata,
  type RequestCorrelation,
} from "../common/types.js";
import { assertNoRawCardData, sanitizeFinancialMetadata } from "../common/security.js";

export const syriaFinancialAuditEventTypes = [
  "payment_attempt",
  "payout_attempt",
  "verification_change",
  "admin_action",
  "suspicious_event",
  "provider_failure",
  "api_failure",
] as const;

export const syriaFinancialAuditEventTypeSchema = z.enum(syriaFinancialAuditEventTypes);

export const syriaFinancialAuditLogSchema = z.object({
  id: financialIdSchema,
  eventType: syriaFinancialAuditEventTypeSchema,
  actor: financialActorSchema,
  targetType: z.string().trim().min(1).max(128),
  targetId: financialIdSchema.optional(),
  correlationId: financialIdSchema,
  immutable: z.literal(true),
  metadata: financialMetadataSchema,
  createdAt: z.string().datetime({ offset: true }),
});

export type SyriaFinancialAuditLog = z.infer<typeof syriaFinancialAuditLogSchema>;

export interface CreateAuditLogInput {
  eventType: SyriaFinancialAuditLog["eventType"];
  actor: FinancialActor;
  targetType: string;
  targetId?: string;
  correlation: RequestCorrelation;
  metadata?: FinancialMetadata;
}

export function createSyriaFinancialAuditLog(input: CreateAuditLogInput): Readonly<SyriaFinancialAuditLog> {
  const metadata = financialMetadataSchema.parse(input.metadata ?? {});
  assertNoRawCardData(metadata);

  return freezeFinancialRecord(
    syriaFinancialAuditLogSchema.parse({
      id: randomUUID(),
      eventType: input.eventType,
      actor: input.actor,
      targetType: input.targetType,
      targetId: input.targetId,
      correlationId: input.correlation.correlationId,
      immutable: true,
      metadata: sanitizeFinancialMetadata(metadata),
      createdAt: nowIso(),
    }),
  );
}
