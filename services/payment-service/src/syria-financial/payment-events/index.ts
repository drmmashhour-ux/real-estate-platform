import { randomUUID } from "node:crypto";
import { z } from "zod";
import {
  financialIdSchema,
  financialMetadataSchema,
  freezeFinancialRecord,
  nowIso,
  requestCorrelationSchema,
  syriaProviderCodeSchema,
} from "../common/types.js";
import { sanitizeFinancialMetadata } from "../common/security.js";

export const syriaPaymentEventTypes = [
  "payment_intent_created",
  "payment_verified",
  "payout_created",
  "webhook_received",
  "provider_health_checked",
  "provider_failure",
] as const;

export const syriaPaymentEventSchema = z.object({
  id: financialIdSchema,
  provider: syriaProviderCodeSchema,
  eventType: z.enum(syriaPaymentEventTypes),
  providerEventId: financialIdSchema.optional(),
  correlation: requestCorrelationSchema,
  metadata: financialMetadataSchema,
  receivedAt: z.string().datetime({ offset: true }),
  processedAt: z.string().datetime({ offset: true }).optional(),
  processingStatus: z.enum(["received", "ignored", "processed", "failed"]),
});

export type SyriaPaymentEvent = z.infer<typeof syriaPaymentEventSchema>;

export function createSyriaPaymentEvent(input: Omit<SyriaPaymentEvent, "id" | "receivedAt">): Readonly<SyriaPaymentEvent> {
  return freezeFinancialRecord(
    syriaPaymentEventSchema.parse({
      ...input,
      id: randomUUID(),
      metadata: sanitizeFinancialMetadata(input.metadata),
      receivedAt: nowIso(),
    }),
  );
}
