import { z } from "zod";

const transactionTypes = [
  "INTENT_CREATED",
  "INTENT_HELD",
  "CAPTURED",
  "REFUNDED",
  "PAYOUT_PREPARED",
  "PAYOUT_SENT",
] as const;

export const createIntentBodySchema = z.object({
  bookingId: z.string().uuid(),
  paymentId: z.string().uuid(),
  amountCents: z.number().int().min(1),
  currency: z.string().length(3).optional(),
});

export const confirmPaymentBodySchema = z.object({
  paymentId: z.string().uuid(),
  intentId: z.string().uuid().optional(),
});

export const refundPaymentBodySchema = z.object({
  paymentId: z.string().uuid(),
  amountCents: z.number().int().min(1).optional(),
  reason: z.string().max(500).optional(),
});

export const historyQuerySchema = z.object({
  paymentId: z.string().uuid().optional(),
  bookingId: z.string().uuid().optional(),
  type: z.enum(transactionTypes).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
  offset: z.coerce.number().int().min(0).optional(),
});

export type CreateIntentBody = z.infer<typeof createIntentBodySchema>;
export type ConfirmPaymentBody = z.infer<typeof confirmPaymentBodySchema>;
export type RefundPaymentBody = z.infer<typeof refundPaymentBodySchema>;
export type HistoryQuery = z.infer<typeof historyQuerySchema>;
