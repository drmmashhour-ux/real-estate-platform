import { z } from "zod";

export const sybnbIdParam = z.string().min(1, "Missing id");

export const sybnbCreateBookingBody = z.object({
  listingId: z.string().min(1, "listingId is required"),
  checkIn: z.string().min(1, "checkIn is required"),
  checkOut: z.string().min(1, "checkOut is required"),
  guests: z.coerce.number().int().min(1, "guests must be at least 1").max(99),
});

export const sybnbReportBody = z.object({
  reason: z.string().optional(),
});

export const sybnbCheckoutSessionBody = z.object({
  bookingId: z.string().min(1, "bookingId is required"),
  idempotencyKey: z.string().optional(),
  locale: z.string().min(2).max(12).optional(),
});

export const sybnbPaymentIntentBody = z.object({
  bookingId: z.string().min(1, "bookingId is required"),
  idempotencyKey: z.string().optional(),
});

export const sybnbVerifyBody = z.discriminatedUnion("mode", [
  z.object({ mode: z.literal("phone") }),
  z.object({ mode: z.literal("manual"), userId: z.string().min(1, "userId is required for manual") }),
]);

export const sybnbWebhookEventBody = z
  .object({
    type: z.string().optional(),
    bookingId: z.string().optional(),
    data: z.unknown().optional(),
  })
  .passthrough();
