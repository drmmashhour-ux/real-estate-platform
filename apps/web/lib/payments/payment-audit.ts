import { persistLaunchEvent } from "@/src/modules/launch/persistLaunchEvent";

export type PaymentAuditPayload = {
  paymentId: string;
  provider: string;
  status: string;
  userId: string;
  bookingId?: string | null;
  source: string;
  paymentIntentId?: string | null;
  stripeEventId?: string | null;
};

/**
 * Structured payment visibility in `launch_events` for admin / ops (non-PII card data).
 */
export function logPaymentAuditEvent(payload: PaymentAuditPayload): Promise<void> {
  return persistLaunchEvent("PAYMENT_AUDIT", {
    ...payload,
    recordedAt: new Date().toISOString(),
  });
}
