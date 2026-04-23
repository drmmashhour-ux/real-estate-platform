/**
 * In-memory dev-only breadcrumbs for the debug panel (__DEV__ only).
 * No secrets; no persistent storage.
 */

let lastBookingId: string | null = null;
let lastStripeSessionId: string | null = null;
let lastPaymentStatus: string | null = null;

export function devCapturePaymentSuccess(bookingId: string, sessionId?: string | null) {
  if (!__DEV__) return;
  lastBookingId = bookingId;
  lastStripeSessionId = sessionId?.trim() || null;
}

export function devCaptureBookingStatus(status: string | null | undefined) {
  if (!__DEV__) return;
  lastPaymentStatus = status ?? null;
}

export function devGetDebugSnapshot() {
  return {
    lastBookingId,
    lastStripeSessionId,
    lastPaymentStatus,
  };
}
