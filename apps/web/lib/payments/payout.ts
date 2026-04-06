import { PaymentStatus, type Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { getStripe, isStripeConfigured } from "@/lib/stripe";
import { getResolvedMarket } from "@/lib/markets";
import { resolveActivePaymentModeFromMarket } from "@/lib/payments/resolve-payment-mode";
import { logError, logInfo, logWarn } from "@/lib/logger";
import { emitPayoutSent } from "@/lib/payments/launch-events";
import { persistMoneyEvent } from "@/lib/payments/money-events";
import { refundGuardForPayout } from "@/lib/payments/refunds";
import type { BookingMoneyBreakdown } from "@/lib/payments/bnhub-money-types";
import { queueBnhubManualHostPayout } from "@/lib/payouts/manual-bnhub";
import { createHostTransfer } from "@/lib/payouts/stripe-transfer";
import { evaluatePayoutEligibility } from "@/lib/payouts/eligibility";
import { refreshHostStripeAccountSnapshotForHost } from "@/lib/stripe/connect/persist-snapshot";

const MS_24H = 24 * 60 * 60 * 1000;

export function computePayoutScheduledAt(checkIn: Date): Date {
  return new Date(checkIn.getTime() + MS_24H);
}

function parseBookingMoneyBreakdown(raw: Prisma.JsonValue | null | undefined): BookingMoneyBreakdown | null {
  if (raw == null || typeof raw !== "object" || Array.isArray(raw)) return null;
  const o = raw as Record<string, unknown>;
  if (typeof o.bookingId !== "string") return null;
  const num = (k: string) => (typeof o[k] === "number" && Number.isFinite(o[k] as number) ? (o[k] as number) : null);
  const sub = num("subtotalCents");
  const total = num("totalChargeCents");
  const host = num("hostPayoutCents");
  const plat = num("platformRevenueCents");
  if (sub == null || total == null || host == null || plat == null) return null;
  return {
    bookingId: o.bookingId,
    currency: "cad",
    subtotalCents: sub,
    cleaningFeeCents: num("cleaningFeeCents") ?? 0,
    taxesCents: num("taxesCents") ?? 0,
    guestServiceFeeCents: num("guestServiceFeeCents") ?? 0,
    hostPayoutCents: host,
    platformRevenueCents: plat,
    totalChargeCents: total,
  };
}

/**
 * After verified guest payment: queue manual settlement or schedule Stripe Connect transfer (check-in + 24h).
 */
export async function schedulePayoutFromBooking(
  bookingId: string,
  hostPayoutCentsOverride?: number | null
): Promise<string> {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    select: {
      checkIn: true,
      totalCents: true,
      listing: { select: { ownerId: true } },
      payment: { select: { hostPayoutCents: true, status: true } },
    },
  });
  if (!booking) {
    throw new Error("Booking not found");
  }
  if (!booking.payment || booking.payment.status !== PaymentStatus.COMPLETED) {
    logWarn("[payout] schedule skipped — payment not completed", { bookingId });
    throw new Error("Booking payment not completed");
  }
  const amount =
    hostPayoutCentsOverride ??
    booking.payment?.hostPayoutCents ??
    Math.max(0, Math.round(booking.totalCents * 0.87));

  const market = await getResolvedMarket();
  const manualMarket = resolveActivePaymentModeFromMarket(market) === "manual";
  if (manualMarket) {
    return queueBnhubManualHostPayout({
      bookingId,
      hostUserId: booking.listing.ownerId,
      amountCents: amount,
      queueReason: "manual_market",
    });
  }

  const host = await prisma.user.findUnique({
    where: { id: booking.listing.ownerId },
    select: { stripeAccountId: true, stripeOnboardingComplete: true },
  });
  const connectReady =
    Boolean(host?.stripeAccountId?.trim()) && Boolean(host?.stripeOnboardingComplete);
  if (!connectReady) {
    return queueBnhubManualHostPayout({
      bookingId,
      hostUserId: booking.listing.ownerId,
      amountCents: amount,
      queueReason: "connect_not_ready",
    });
  }

  await refreshHostStripeAccountSnapshotForHost(booking.listing.ownerId);

  const { id: payoutId, created } = await schedulePayoutForBooking(
    bookingId,
    booking.listing.ownerId,
    amount
  );
  if (created) {
    await persistMoneyEvent({
      type: "host_payout_eligible",
      bookingId,
      hostUserId: booking.listing.ownerId,
      amountCents: amount,
      metadata: { orchestratedPayoutId: payoutId, rail: "stripe_connect" },
    });
  }
  return payoutId;
}

/**
 * Schedule host payout for a booking (check-in + 24h). Stripe Connect transfers only.
 * Transactional: prevents duplicate scheduled rows under concurrent webhooks.
 */
export async function schedulePayoutForBooking(
  bookingId: string,
  hostId: string,
  amountCents: number
): Promise<{ id: string; created: boolean }> {
  return prisma.$transaction(async (tx) => {
    const existing = await tx.orchestratedPayout.findFirst({
      where: {
        bookingId,
        status: { in: ["scheduled", "sent"] },
      },
      select: { id: true },
    });
    if (existing) {
      logInfo("[payout] idempotent skip — payout already scheduled or sent", {
        payoutId: existing.id,
        bookingId,
      });
      return { id: existing.id, created: false };
    }

    const booking = await tx.booking.findUnique({
      where: { id: bookingId },
      select: { checkIn: true },
    });
    if (!booking) {
      throw new Error("Booking not found");
    }
    const scheduledAt = computePayoutScheduledAt(booking.checkIn);

    const row = await tx.orchestratedPayout.create({
      data: {
        provider: "stripe",
        hostId,
        amountCents,
        currency: "cad",
        status: "scheduled",
        scheduledAt,
        bookingId,
        payoutMethod: "stripe_connect",
        availableAt: scheduledAt,
      },
    });
    logInfo("[payout] scheduled orchestrated payout", {
      payoutId: row.id,
      bookingId,
      scheduledAt,
      transferId: null,
      sessionId: null,
      paymentIntentId: null,
    });
    return { id: row.id, created: true };
  });
}

export type ExecutePayoutResult = { ok: true; transferId: string } | { ok: false; error: string };

/**
 * Executes a Stripe Connect transfer to the host connected account.
 * Idempotent: `providerRef` + `sent` short-circuits; Stripe `idempotencyKey` hardens retries.
 */
export async function executeOrchestratedPayout(payoutId: string): Promise<ExecutePayoutResult> {
  const row = await prisma.orchestratedPayout.findUnique({ where: { id: payoutId } });
  if (!row) {
    return { ok: false, error: "Payout not found" };
  }
  if (row.payoutMethod === "manual") {
    return { ok: false, error: "Manual payout row — use admin manual settlement" };
  }
  if (row.status === "sent" && row.providerRef) {
    logInfo("[payout] idempotent skip — already sent", {
      payoutId,
      transferId: row.providerRef,
      sessionId: null,
      paymentIntentId: null,
    });
    return { ok: true, transferId: row.providerRef };
  }
  if (row.status !== "scheduled") {
    return { ok: false, error: "Payout not found or not scheduled" };
  }
  if (row.providerRef) {
    logWarn("[payout] scheduled row already has providerRef — reconciling as sent", {
      payoutId,
      transferId: row.providerRef,
    });
    await prisma.orchestratedPayout.update({
      where: { id: payoutId },
      data: { status: "sent", paidAt: new Date() },
    });
    return { ok: true, transferId: row.providerRef };
  }
  if (row.provider !== "stripe") {
    return {
      ok: false,
      error:
        "Clover / non-Stripe orchestrated payouts are not executed here — marketplace host payouts use Stripe Connect only.",
    };
  }

  const host = await prisma.user.findUnique({
    where: { id: row.hostId },
    select: { stripeAccountId: true, stripeOnboardingComplete: true },
  });
  const destination = host?.stripeAccountId?.trim();
  if (!destination) {
    logWarn("[payout] host missing stripeAccountId", { hostId: row.hostId });
    await prisma.orchestratedPayout.update({
      where: { id: payoutId },
      data: { status: "failed", failureReason: "Host Connect account not ready" },
    });
    await persistMoneyEvent({
      type: "host_payout_failed",
      bookingId: row.bookingId ?? "",
      hostUserId: row.hostId,
      amountCents: row.amountCents,
      metadata: { orchestratedPayoutId: payoutId, reason: "missing_stripe_account" },
    });
    return { ok: false, error: "Host Connect account not ready" };
  }

  if (!row.bookingId) {
    return { ok: false, error: "Payout row missing bookingId" };
  }

  const booking = await prisma.booking.findUnique({
    where: { id: row.bookingId },
    select: {
      refunded: true,
      listingId: true,
      listing: { select: { ownerId: true } },
      payment: {
        select: {
          status: true,
          moneyBreakdownJson: true,
        },
      },
    },
  });
  if (booking?.listing?.ownerId && booking.listing.ownerId !== row.hostId) {
    logWarn("[payout] host mismatch vs listing owner", { payoutId, bookingId: row.bookingId });
    return { ok: false, error: "host_mismatch" };
  }
  const paymentStatusRefunded = booking?.payment?.status === PaymentStatus.REFUNDED;
  const refundAgg = await prisma.bnhubMarketplaceRefund.aggregate({
    where: { bookingId: row.bookingId, refundStatus: "SUCCEEDED" },
    _sum: { amountCents: true },
  });
  const pendingRefund = await prisma.bnhubMarketplaceRefund.count({
    where: { bookingId: row.bookingId, refundStatus: "PENDING" },
  });
  const succeededRefundCents = refundAgg._sum.amountCents ?? 0;

  const guard = refundGuardForPayout({
    bookingRefunded: Boolean(booking?.refunded),
    paymentStatusRefunded,
    refundPending: pendingRefund > 0,
    partialRefundCents: succeededRefundCents,
    moneyBreakdown: parseBookingMoneyBreakdown(booking?.payment?.moneyBreakdownJson),
    existingTransferId: row.providerRef,
  });

  if (!guard.allowTransfer) {
    if (guard.reason === "refund_pending") {
      logInfo("[payout] hold — refund pending", { payoutId, bookingId: row.bookingId });
      return { ok: false, error: "refund_pending" };
    }
    await prisma.orchestratedPayout.update({
      where: { id: payoutId },
      data: { status: "failed", failureReason: guard.reason ?? "blocked" },
    });
    await persistMoneyEvent({
      type: "host_payout_failed",
      bookingId: row.bookingId,
      hostUserId: row.hostId,
      amountCents: row.amountCents,
      metadata: { orchestratedPayoutId: payoutId, reason: guard.reason },
    });
    return { ok: false, error: guard.reason ?? "blocked" };
  }

  let transferAmount = row.amountCents;
  if (typeof guard.adjustedHostPayoutCents === "number" && guard.adjustedHostPayoutCents < transferAmount) {
    transferAmount = guard.adjustedHostPayoutCents;
    await prisma.orchestratedPayout.update({
      where: { id: payoutId },
      data: { amountCents: transferAmount },
    });
  }

  await refreshHostStripeAccountSnapshotForHost(row.hostId);
  const snap = await prisma.hostStripeAccountSnapshot.findUnique({
    where: { hostUserId: row.hostId },
    select: { payoutsEnabled: true },
  });
  const market = await getResolvedMarket();
  const manualMarket = resolveActivePaymentModeFromMarket(market) === "manual";
  const bookingPaid = booking?.payment?.status === PaymentStatus.COMPLETED;
  const hostHasConnectedAccount = Boolean(host?.stripeAccountId?.trim());
  const payoutsEnabled = Boolean(
    snap?.payoutsEnabled ?? (host?.stripeOnboardingComplete && hostHasConnectedAccount)
  );
  const now = new Date();
  const bookingCompleted = !row.scheduledAt || now >= row.scheduledAt;

  const elig = evaluatePayoutEligibility({
    bookingPaid: Boolean(bookingPaid),
    hostHasConnectedAccount,
    payoutsEnabled,
    bookingCompleted,
    manualMarket,
  });

  if (!elig.eligible) {
    if (elig.status === "not_ready" && elig.reason === "stay_not_completed") {
      return { ok: false, error: "stay_not_completed" };
    }
    if (elig.status === "manual" && row.bookingId) {
      await queueBnhubManualHostPayout({
        bookingId: row.bookingId,
        hostUserId: row.hostId,
        amountCents: transferAmount,
        queueReason: elig.reason ?? "manual_routing",
      }).catch((e) => logError("[payout] manual queue from eligibility failed", e));
    }
    await prisma.orchestratedPayout.updateMany({
      where: { id: payoutId, status: "scheduled" },
      data: { status: "failed", failureReason: `ineligible:${elig.reason ?? "unknown"}` },
    });
    await persistMoneyEvent({
      type: "host_payout_failed",
      bookingId: row.bookingId ?? "",
      hostUserId: row.hostId,
      amountCents: row.amountCents,
      metadata: { orchestratedPayoutId: payoutId, reason: elig.reason, eligibility: elig.status },
    });
    return { ok: false, error: elig.reason ?? "not_eligible" };
  }

  if (!isStripeConfigured()) {
    return { ok: false, error: "Stripe not configured" };
  }
  const stripe = getStripe();
  if (!stripe) return { ok: false, error: "Stripe client unavailable" };

  try {
    const transfer = await createHostTransfer({
      connectedAccountId: destination,
      amountCents: transferAmount,
      bookingId: row.bookingId,
      idempotencyKey: `orch_payout_${payoutId}`,
      stripe,
      extraMetadata: {
        orchestratedPayoutId: row.id,
        ...(booking?.listingId ? { listingId: booking.listingId } : {}),
        hostUserId: row.hostId,
        flow: "bnhub_host_payout",
      },
    });

    const applied = await prisma.orchestratedPayout.updateMany({
      where: { id: payoutId, status: "scheduled", providerRef: null },
      data: { status: "sent", providerRef: transfer.id, paidAt: new Date() },
    });

    logInfo("[payout] connect transfer reconciliation", {
      payoutId,
      transferId: transfer.id,
      bookingId: row.bookingId ?? null,
      sessionId: null,
      paymentIntentId: null,
      rowsUpdated: applied.count,
    });

    if (applied.count === 0) {
      const again = await prisma.orchestratedPayout.findUnique({
        where: { id: payoutId },
        select: { providerRef: true, status: true },
      });
      if (again?.providerRef) {
        return { ok: true, transferId: again.providerRef };
      }
      return { ok: false, error: "Concurrent payout execution or row changed" };
    }

    await emitPayoutSent({
      payoutId: row.id,
      transferId: transfer.id,
      hostId: row.hostId,
      amountCents: transferAmount,
    });
    await persistMoneyEvent({
      type: "host_payout_sent",
      bookingId: row.bookingId,
      hostUserId: row.hostId,
      amountCents: transferAmount,
      metadata: { orchestratedPayoutId: payoutId, stripeTransferId: transfer.id },
    });
    return { ok: true, transferId: transfer.id };
  } catch (e) {
    logError("executeOrchestratedPayout transfer failed", e);
    const msg = e instanceof Error ? e.message : "Transfer failed";
    await prisma.orchestratedPayout.updateMany({
      where: { id: payoutId, status: "scheduled" },
      data: { status: "failed", failureReason: msg },
    });
    await persistMoneyEvent({
      type: "host_payout_failed",
      bookingId: row.bookingId ?? "",
      hostUserId: row.hostId,
      amountCents: row.amountCents,
      metadata: { orchestratedPayoutId: payoutId, reason: msg },
    });
    return { ok: false, error: msg };
  }
}

/** @alias executeOrchestratedPayout */
export { executeOrchestratedPayout as executePayout };
