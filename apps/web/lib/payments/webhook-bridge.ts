import { prisma } from "@/lib/db";
import { logInfo } from "@/lib/logger";
import { emitPaymentFailed, emitPaymentSuccess } from "@/lib/payments/launch-events";
import { logPaymentAuditEvent } from "@/lib/payments/payment-audit";

const NON_TERMINAL = ["pending", "requires_action"] as const;

/**
 * Sync `OrchestratedPayment` from Stripe Checkout session id (e.g. after `checkout.session.completed`).
 * Idempotent: duplicate Stripe deliveries use `updateMany` with non-terminal status only — no double emits.
 * Emits `PAYMENT_SUCCESS` with `source: orchestration_stripe` for non-booking rows (booking success stays on BNHub path).
 */
export async function markOrchestratedPaymentFromStripeSession(args: {
  sessionId: string;
  succeeded: boolean;
  stripePaymentIntentId?: string | null;
  stripeEventId?: string | null;
  /** Stripe session metadata.paymentType when available (audit only) */
  stripePaymentType?: string | null;
  extraPayload?: Record<string, unknown>;
}): Promise<{ applied: boolean; orchestratedPaymentId?: string }> {
  const row = await prisma.orchestratedPayment.findFirst({
    where: { provider: "stripe", providerPaymentId: args.sessionId },
    select: { id: true, paymentType: true, userId: true, bookingId: true, amountCents: true, status: true },
  });
  if (!row) {
    logInfo("[orchestration] no orchestrated row for session (ok for non-orchestrated checkouts)", {
      sessionId: args.sessionId,
      stripeEventId: args.stripeEventId ?? null,
    });
    return { applied: false };
  }

  const nextStatus = args.succeeded ? "succeeded" : "failed";
  const update = await prisma.orchestratedPayment.updateMany({
    where: {
      id: row.id,
      provider: "stripe",
      providerPaymentId: args.sessionId,
      status: { in: [...NON_TERMINAL] },
    },
    data: {
      status: nextStatus,
      ...(args.stripePaymentIntentId
        ? { stripePaymentIntentId: args.stripePaymentIntentId }
        : {}),
    },
  });

  logInfo("[orchestration] stripe checkout.session.completed reconciliation", {
    sessionId: args.sessionId,
    paymentIntentId: args.stripePaymentIntentId ?? null,
    stripeEventId: args.stripeEventId ?? null,
    orchestratedPaymentId: row.id,
    payoutId: null,
    transferId: null,
    rowsUpdated: update.count,
    targetStatus: nextStatus,
  });

  if (update.count === 0) {
    logInfo("[orchestration] idempotent skip — orchestrated payment already finalized", {
      sessionId: args.sessionId,
      orchestratedPaymentId: row.id,
      currentStatus: row.status,
      stripeEventId: args.stripeEventId ?? null,
    });
    return { applied: false, orchestratedPaymentId: row.id };
  }

  if (args.succeeded) {
    void logPaymentAuditEvent({
      paymentId: row.id,
      provider: "stripe",
      status: "succeeded",
      userId: row.userId,
      bookingId: row.bookingId,
      source: "orchestration_stripe_webhook",
      paymentIntentId: args.stripePaymentIntentId ?? null,
      stripeEventId: args.stripeEventId ?? null,
    }).catch(() => {});
    if (row.paymentType !== "booking") {
      await emitPaymentSuccess({
        source: "orchestration_stripe",
        orchestratedPaymentId: row.id,
        userId: row.userId,
        bookingId: row.bookingId,
        sessionId: args.sessionId,
        paymentType: row.paymentType,
        stripeMetadataPaymentType: args.stripePaymentType ?? undefined,
        amountCents: row.amountCents,
        stripeEventId: args.stripeEventId ?? undefined,
        paymentIntentId: args.stripePaymentIntentId ?? undefined,
        ...args.extraPayload,
      });
    }
  } else {
    void logPaymentAuditEvent({
      paymentId: row.id,
      provider: "stripe",
      status: "failed",
      userId: row.userId,
      bookingId: row.bookingId,
      source: "orchestration_stripe_webhook",
      paymentIntentId: args.stripePaymentIntentId ?? null,
      stripeEventId: args.stripeEventId ?? null,
    }).catch(() => {});
    await emitPaymentFailed({
      orchestratedPaymentId: row.id,
      provider: "stripe",
      sessionId: args.sessionId,
      stripeEventId: args.stripeEventId ?? undefined,
      paymentIntentId: args.stripePaymentIntentId ?? undefined,
      ...args.extraPayload,
    });
  }

  return { applied: true, orchestratedPaymentId: row.id };
}

/**
 * Clover Hosted Checkout webhook → orchestration ledger (no Connect marketplace payouts).
 */
export async function markOrchestratedPaymentFromCloverSession(args: {
  checkoutSessionId: string;
  approved: boolean;
  cloverPaymentId?: string | null;
}): Promise<{ applied: boolean; orchestratedPaymentId?: string }> {
  const row = await prisma.orchestratedPayment.findFirst({
    where: { provider: "clover", providerPaymentId: args.checkoutSessionId },
    select: { id: true, paymentType: true, userId: true, bookingId: true, amountCents: true, status: true },
  });
  if (!row) {
    logInfo("[orchestration] no orchestrated Clover row for session", {
      checkoutSessionId: args.checkoutSessionId,
    });
    return { applied: false };
  }

  const nextStatus = args.approved ? "succeeded" : "failed";
  const update = await prisma.orchestratedPayment.updateMany({
    where: {
      id: row.id,
      provider: "clover",
      providerPaymentId: args.checkoutSessionId,
      status: { in: [...NON_TERMINAL] },
    },
    data: { status: nextStatus },
  });

  logInfo("[orchestration] clover hosted checkout reconciliation", {
    checkoutSessionId: args.checkoutSessionId,
    cloverPaymentId: args.cloverPaymentId ?? null,
    orchestratedPaymentId: row.id,
    rowsUpdated: update.count,
    targetStatus: nextStatus,
  });

  if (update.count === 0) {
    logInfo("[orchestration] idempotent skip — Clover orchestrated row already finalized", {
      checkoutSessionId: args.checkoutSessionId,
      orchestratedPaymentId: row.id,
    });
    return { applied: false, orchestratedPaymentId: row.id };
  }

  if (args.approved) {
    void logPaymentAuditEvent({
      paymentId: row.id,
      provider: "clover",
      status: "succeeded",
      userId: row.userId,
      bookingId: row.bookingId,
      source: "orchestration_clover_webhook",
    }).catch(() => {});
    if (row.paymentType !== "booking") {
      await emitPaymentSuccess({
        source: "orchestration_clover",
        orchestratedPaymentId: row.id,
        userId: row.userId,
        bookingId: row.bookingId,
        checkoutSessionId: args.checkoutSessionId,
        paymentType: row.paymentType,
        amountCents: row.amountCents,
        cloverPaymentId: args.cloverPaymentId ?? undefined,
      });
    }
  } else {
    void logPaymentAuditEvent({
      paymentId: row.id,
      provider: "clover",
      status: "failed",
      userId: row.userId,
      bookingId: row.bookingId,
      source: "orchestration_clover_webhook",
    }).catch(() => {});
    await emitPaymentFailed({
      orchestratedPaymentId: row.id,
      provider: "clover",
      checkoutSessionId: args.checkoutSessionId,
      cloverPaymentId: args.cloverPaymentId ?? undefined,
    });
  }

  return { applied: true, orchestratedPaymentId: row.id };
}
