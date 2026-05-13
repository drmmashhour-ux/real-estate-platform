import { z } from "zod";
import { providerMetadataSchema, syriaPaymentProviderIdSchema } from "../providers/types.js";

export const SYRIA_PAYMENT_EVENT_STATUSES = ["received", "validated", "rejected", "processed"] as const;
export const syriaPaymentEventStatusSchema = z.enum(SYRIA_PAYMENT_EVENT_STATUSES);

export const createPaymentEventSchema = z.object({
  provider: syriaPaymentProviderIdSchema,
  providerEventId: z.string().trim().min(1),
  eventType: z.string().trim().min(1),
  transactionId: z.string().uuid().optional(),
  correlationId: z.string().trim().min(1),
  payload: providerMetadataSchema,
});

export type SyriaPaymentEventStatus = z.infer<typeof syriaPaymentEventStatusSchema>;
export type CreateSyriaPaymentEventInput = z.infer<typeof createPaymentEventSchema>;

export interface SyriaPaymentEvent {
  id: string;
  provider: CreateSyriaPaymentEventInput["provider"];
  providerEventId: string;
  eventType: string;
  transactionId?: string;
  correlationId: string;
  status: SyriaPaymentEventStatus;
  payload: Readonly<CreateSyriaPaymentEventInput["payload"]>;
  receivedAt: Date;
}
