import { prisma } from "@/lib/db";
import { sybnbConfig } from "@/config/sybnb.config";
import { sybnbPaymentsHeldForSoftLaunch } from "@/lib/sybnb/config";
import { logTimelineEvent } from "@/lib/timeline/log-event";

function sybnbStripeRuntimeEnabled(): boolean {
  return sybnbConfig.paymentsEnabled && !sybnbPaymentsHeldForSoftLaunch();
}

/**
 * SYBNB-4: payment abstraction. No Stripe SDK is imported here; when `sybnbConfig.paymentsEnabled` is
 * false, all paths return in-process mocks. Wire Stripe in this module when activating card checkout.
 */

export type SybnbCheckoutSessionResult = {
  ok: boolean;
  mode: "disabled" | "mock" | "stripe_pending";
  sessionId: string | null;
  url: string | null;
  body?: { message?: string };
};

/**
 * Append-only audit for operator review (and future webhook correlation).
 */
export async function recordCheckoutAttempt(bookingId: string, actorId: string) {
  void logTimelineEvent({
    entityType: "sybnb_booking",
    entityId: bookingId,
    action: "sybnb_checkout_attempt",
    actorId,
    actorRole: "guest",
    metadata: { provider: sybnbConfig.provider },
  });
  return prisma.sybnbPaymentAudit.create({
    data: {
      bookingId,
      actorId,
      event: "checkout_attempt",
      provider: sybnbConfig.provider,
    },
  });
}

/**
 * When payments are off or provider is not Stripe, returns mock metadata only (no network).
 */
export async function createCheckoutSession(input: {
  bookingId: string;
  actorId: string;
}): Promise<SybnbCheckoutSessionResult> {
  if (!sybnbStripeRuntimeEnabled()) {
    void logTimelineEvent({
      entityType: "sybnb_booking",
      entityId: input.bookingId,
      action: "sybnb_escrow_simulated_secured",
      actorId: input.actorId,
      actorRole: "guest",
      metadata: { checkoutMode: "disabled_manual_mock" },
    });
    return {
      ok: true,
      mode: "disabled",
      sessionId: null,
      url: null,
      body: { message: "Payment handled manually" },
    };
  }
  if (sybnbConfig.provider !== "stripe") {
    void logTimelineEvent({
      entityType: "sybnb_booking",
      entityId: input.bookingId,
      action: "sybnb_escrow_simulated_secured",
      actorId: input.actorId,
      actorRole: "guest",
      metadata: { checkoutMode: "provider_mock" },
    });
    return {
      ok: true,
      mode: "mock",
      sessionId: null,
      url: null,
    };
  }
  // Future: create Stripe Checkout Session; keep behind feature flag and env keys.
  return {
    ok: true,
    mode: "stripe_pending",
    sessionId: null,
    url: null,
  };
}

/**
 * Webhook or client callback (future). Safe no-op when payments disabled.
 */
export async function handlePaymentSuccess(
  bookingId: string,
  _metadata?: { providerEventId?: string },
): Promise<{ ok: true; mock: boolean }> {
  if (!sybnbStripeRuntimeEnabled()) {
    void logTimelineEvent({
      entityType: "sybnb_booking",
      entityId: bookingId,
      action: "sybnb_escrow_simulated_released",
      metadata: { mockSettlement: true },
    });
    return { ok: true, mock: true };
  }
  // Future: idempotent mark paid, emit audit, revalidate
  return { ok: true, mock: false };
}

/**
 * Webhook: failed / cancelled charge (future). Safe no-op when payments disabled.
 */
export async function handlePaymentFailure(
  _bookingId: string,
  _metadata?: { reason?: string },
): Promise<{ ok: true; mock: boolean }> {
  if (!sybnbStripeRuntimeEnabled()) {
    return { ok: true, mock: true };
  }
  return { ok: true, mock: false };
}
