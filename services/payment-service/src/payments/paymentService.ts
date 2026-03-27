import type { Prisma } from "@prisma/client";
import { prisma } from "../db.js";
import { getPaymentProvider } from "../provider/index.js";
import type { TransactionType } from "@prisma/client";

const provider = getPaymentProvider();

export interface CreateIntentInput {
  bookingId: string;
  paymentId: string;
  amountCents: number;
  currency?: string;
}

/** Create payment intent (escrow hold). Returns clientSecret for frontend. */
export async function createIntent(input: CreateIntentInput) {
  const payment = await prisma.payment.findUnique({
    where: { id: input.paymentId },
    include: { booking: true },
  });
  if (!payment) throw new Error("Payment not found");
  if (payment.bookingId !== input.bookingId) throw new Error("Payment does not match booking");
  if (payment.status !== "PENDING") throw new Error("Payment is not pending");

  const existing = await prisma.paymentIntent.findUnique({
    where: { paymentId: input.paymentId },
  });
  if (existing && existing.status === "HELD") {
    return {
      intentId: existing.id,
      clientSecret: `mock_secret_${existing.providerIntentId}`,
      providerIntentId: existing.providerIntentId,
      status: existing.status,
    };
  }
  if (existing && (existing.status === "CAPTURED" || existing.status === "CANCELLED"))
    throw new Error("Intent already finalized");

  const result = await provider.createIntent({
    amountCents: input.amountCents,
    currency: input.currency ?? "usd",
    metadata: { bookingId: input.bookingId, paymentId: input.paymentId },
  });

  const intent = await prisma.paymentIntent.upsert({
    where: { paymentId: input.paymentId },
    create: {
      bookingId: input.bookingId,
      paymentId: input.paymentId,
      amountCents: input.amountCents,
      currency: input.currency ?? "usd",
      providerIntentId: result.providerIntentId,
      status: "HELD",
    },
    update: {
      amountCents: input.amountCents,
      providerIntentId: result.providerIntentId,
      status: "HELD",
    },
  });

  await prisma.transaction.createMany({
    data: [
      { type: "INTENT_CREATED", paymentId: input.paymentId, paymentIntentId: intent.id, amountCents: input.amountCents, providerRef: result.providerIntentId },
      { type: "INTENT_HELD", paymentId: input.paymentId, paymentIntentId: intent.id, amountCents: input.amountCents, providerRef: result.providerIntentId },
    ],
  });

  return {
    intentId: intent.id,
    clientSecret: result.clientSecret,
    providerIntentId: result.providerIntentId,
    status: intent.status,
  };
}

export interface ConfirmInput {
  paymentId: string;
  /** Optional: confirm by intent id instead */
  intentId?: string;
}

/** Confirm (capture) payment. Updates Payment to COMPLETED, Intent to CAPTURED, records transaction. */
export async function confirmPayment(input: ConfirmInput) {
  const intent = input.intentId
    ? await prisma.paymentIntent.findUnique({ where: { id: input.intentId }, include: { payment: true } })
    : await prisma.paymentIntent.findFirst({ where: { paymentId: input.paymentId }, include: { payment: true } });
  if (!intent) throw new Error("Payment intent not found");
  if (intent.paymentId !== input.paymentId && !input.intentId) throw new Error("Intent does not match payment");
  if (intent.status !== "HELD") throw new Error("Intent is not in HELD state");

  await provider.captureIntent({ providerIntentId: intent.providerIntentId! });

  await prisma.$transaction([
    prisma.paymentIntent.update({
      where: { id: intent.id },
      data: { status: "CAPTURED" },
    }),
    prisma.payment.update({
      where: { id: intent.paymentId },
      data: { status: "COMPLETED", stripePaymentId: intent.providerIntentId ?? undefined },
    }),
    prisma.transaction.create({
      data: {
        type: "CAPTURED",
        paymentId: intent.paymentId,
        paymentIntentId: intent.id,
        amountCents: intent.amountCents,
        providerRef: intent.providerIntentId ?? undefined,
      },
    }),
  ]);

  const booking = await prisma.booking.findUnique({
    where: { id: intent.bookingId },
    include: { listing: true },
  });
  if (booking?.listing && intent.payment?.hostPayoutCents) {
    await preparePayoutForBooking(intent.paymentId, booking.listing.ownerId, intent.payment.hostPayoutCents);
  }

  return prisma.payment.findUniqueOrThrow({
    where: { id: intent.paymentId },
    include: { booking: true },
  });
}

async function preparePayoutForBooking(paymentId: string, hostId: string, hostPayoutCents: number) {
  const payout = await prisma.payout.create({
    data: {
      hostId,
      totalCents: hostPayoutCents,
      status: "PENDING",
      payments: { create: [{ paymentId }] },
    },
  });
  await prisma.transaction.create({
    data: {
      type: "PAYOUT_PREPARED",
      paymentId,
      payoutId: payout.id,
      amountCents: hostPayoutCents,
    },
  });
  return payout;
}

export interface RefundInput {
  paymentId: string;
  amountCents?: number;
  reason?: string;
}

/** Refund a payment (full or partial). Sets Payment status to REFUNDED, records transaction. */
export async function refundPayment(input: RefundInput) {
  const payment = await prisma.payment.findUnique({
    where: { id: input.paymentId },
    include: { intent: true },
  });
  if (!payment) throw new Error("Payment not found");
  if (payment.status === "REFUNDED") throw new Error("Payment already refunded");
  const providerPaymentId = payment.stripePaymentId ?? payment.intent?.providerIntentId;
  if (!providerPaymentId) throw new Error("No provider payment ID to refund");

  const amountCents = input.amountCents ?? payment.amountCents;
  const result = await provider.refund({
    providerPaymentId,
    amountCents: amountCents < payment.amountCents ? amountCents : undefined,
    reason: input.reason,
  });

  await prisma.$transaction([
    prisma.payment.update({
      where: { id: input.paymentId },
      data: { status: "REFUNDED" },
    }),
    prisma.transaction.create({
      data: {
        type: "REFUNDED",
        paymentId: input.paymentId,
        amountCents,
        providerRef: result.providerRefundId,
        metadata: input.reason ? JSON.stringify({ reason: input.reason }) : null,
      },
    }),
  ]);

  return prisma.payment.findUniqueOrThrow({
    where: { id: input.paymentId },
    include: { booking: true },
  });
}

export interface HistoryFilters {
  paymentId?: string;
  bookingId?: string;
  type?: TransactionType;
  limit?: number;
  offset?: number;
}

/** Get transaction history with optional filters. */
export async function getHistory(filters: HistoryFilters) {
  const limit = Math.min(filters.limit ?? 50, 100);
  const offset = filters.offset ?? 0;

  const where: Prisma.TransactionWhereInput = {};
  if (filters.paymentId) where.paymentId = filters.paymentId;
  if (filters.bookingId) {
    const payment = await prisma.payment.findFirst({ where: { bookingId: filters.bookingId }, select: { id: true } });
    if (!payment) return { data: [], pagination: { limit, offset, total: 0 } };
    where.paymentId = payment.id;
  }
  if (filters.type) where.type = filters.type;

  const [items, total] = await Promise.all([
    prisma.transaction.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: limit,
      skip: offset,
      include: {
        payment: { select: { id: true, bookingId: true, amountCents: true, status: true } },
        payout: { select: { id: true, hostId: true, totalCents: true, status: true } },
      },
    }),
    prisma.transaction.count({ where }),
  ]);

  return {
    data: items.map((t) => ({
      id: t.id,
      type: t.type,
      paymentId: t.paymentId,
      payment: t.payment,
      payoutId: t.payoutId,
      payout: t.payout,
      amountCents: t.amountCents,
      providerRef: t.providerRef,
      metadata: t.metadata,
      createdAt: t.createdAt.toISOString(),
    })),
    pagination: { limit, offset, total },
  };
}
