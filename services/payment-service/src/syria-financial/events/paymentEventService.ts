import { randomUUID } from "node:crypto";
import { redactFinancialSecrets } from "../security.js";
import { createPaymentEventSchema, type CreateSyriaPaymentEventInput, type SyriaPaymentEvent } from "./types.js";

export function createSyriaPaymentEvent(
  input: CreateSyriaPaymentEventInput,
  receivedAt: Date = new Date(),
): SyriaPaymentEvent {
  const parsed = createPaymentEventSchema.parse(input);
  return {
    id: randomUUID(),
    provider: parsed.provider,
    providerEventId: parsed.providerEventId,
    eventType: parsed.eventType,
    transactionId: parsed.transactionId,
    correlationId: parsed.correlationId,
    status: "received",
    payload: Object.freeze(redactFinancialSecrets(parsed.payload) as CreateSyriaPaymentEventInput["payload"]),
    receivedAt,
  };
}
