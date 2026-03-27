import type { Prisma } from "@prisma/client";
import {
  BnhubMpLedgerDirection,
  BnhubMpLedgerEntity,
  BnhubMpPaymentEventActor,
} from "@prisma/client";
import { prisma } from "@/lib/db";

export async function logMarketplacePaymentEvent(params: {
  reservationPaymentId?: string | null;
  payoutId?: string | null;
  refundId?: string | null;
  disputeId?: string | null;
  bookingId?: string | null;
  actorType: BnhubMpPaymentEventActor;
  actorId?: string | null;
  eventType: string;
  eventData: Record<string, unknown>;
}) {
  await prisma.bnhubMarketplacePaymentEvent.create({
    data: {
      reservationPaymentId: params.reservationPaymentId ?? undefined,
      payoutId: params.payoutId ?? undefined,
      refundId: params.refundId ?? undefined,
      disputeId: params.disputeId ?? undefined,
      bookingId: params.bookingId ?? undefined,
      actorType: params.actorType,
      actorId: params.actorId ?? undefined,
      eventType: params.eventType,
      eventDataJson: params.eventData as Prisma.InputJsonValue,
    },
  });
}

export async function logPaymentEvent(
  reservationPaymentId: string,
  bookingId: string,
  eventType: string,
  eventData: Record<string, unknown>,
  actor: BnhubMpPaymentEventActor = BnhubMpPaymentEventActor.SYSTEM,
  actorId?: string | null
) {
  await logMarketplacePaymentEvent({
    reservationPaymentId,
    bookingId,
    actorType: actor,
    actorId,
    eventType,
    eventData,
  });
}

export async function logPayoutEvent(
  payoutId: string,
  bookingId: string,
  eventType: string,
  eventData: Record<string, unknown>,
  actor: BnhubMpPaymentEventActor = BnhubMpPaymentEventActor.SYSTEM,
  actorId?: string | null
) {
  await logMarketplacePaymentEvent({
    payoutId,
    bookingId,
    actorType: actor,
    actorId,
    eventType,
    eventData,
  });
}

export async function logRefundEvent(
  refundId: string,
  bookingId: string,
  eventType: string,
  eventData: Record<string, unknown>,
  actor: BnhubMpPaymentEventActor = BnhubMpPaymentEventActor.SYSTEM,
  actorId?: string | null
) {
  await logMarketplacePaymentEvent({
    refundId,
    bookingId,
    actorType: actor,
    actorId,
    eventType,
    eventData,
  });
}

export async function logDisputeEvent(
  disputeId: string,
  bookingId: string,
  eventType: string,
  eventData: Record<string, unknown>,
  actor: BnhubMpPaymentEventActor = BnhubMpPaymentEventActor.SYSTEM
) {
  await logMarketplacePaymentEvent({
    disputeId,
    bookingId,
    actorType: actor,
    eventType,
    eventData,
  });
}

export async function logFinancialOverride(
  bookingId: string,
  summary: string,
  eventData: Record<string, unknown>,
  adminUserId: string
) {
  await logMarketplacePaymentEvent({
    bookingId,
    actorType: BnhubMpPaymentEventActor.ADMIN,
    actorId: adminUserId,
    eventType: "financial_override",
    eventData: { summary, ...eventData },
  });
}

export async function appendLedgerEntry(params: {
  entityType: BnhubMpLedgerEntity;
  entityId: string;
  bookingId?: string | null;
  userId?: string | null;
  direction: BnhubMpLedgerDirection;
  amountCents: number;
  currency: string;
  entryType: string;
  summary: string;
}) {
  await prisma.bnhubFinancialLedgerEntry.create({
    data: {
      entityType: params.entityType,
      entityId: params.entityId,
      bookingId: params.bookingId ?? undefined,
      userId: params.userId ?? undefined,
      direction: params.direction,
      amountCents: params.amountCents,
      currency: params.currency,
      entryType: params.entryType,
      summary: params.summary,
    },
  });
}
