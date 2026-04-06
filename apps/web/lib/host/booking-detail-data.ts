import type { PaymentStatus, Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import type { BookingMoneyBreakdown } from "@/lib/payments/bnhub-money-types";

function parseMoneyBreakdown(raw: Prisma.JsonValue | null | undefined): BookingMoneyBreakdown | null {
  if (raw == null || typeof raw !== "object" || Array.isArray(raw)) return null;
  const o = raw as Record<string, unknown>;
  if (typeof o.bookingId !== "string") return null;
  const num = (k: string) =>
    typeof o[k] === "number" && Number.isFinite(o[k] as number) ? (o[k] as number) : null;
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

const NON_CANCELABLE = new Set([
  "DECLINED",
  "CANCELLED",
  "CANCELLED_BY_GUEST",
  "CANCELLED_BY_HOST",
  "COMPLETED",
  "DISPUTED",
  "EXPIRED",
]);

export type HostBookingDetail = {
  id: string;
  confirmationCode: string | null;
  bookingCode: string | null;
  status: string;
  createdAt: Date;
  canceledAt: Date | null;
  checkIn: Date;
  checkOut: Date;
  nights: number;
  guestsCount: number | null;
  guestContactName: string | null;
  guestContactEmail: string | null;
  guestContactPhone: string | null;
  guest: { name: string | null; email: string; phone: string | null } | null;
  listing: { id: string; title: string; city: string };
  payment: {
    status: PaymentStatus;
    amountCents: number;
    guestFeeCents: number;
    hostFeeCents: number;
    stripePaymentId: string | null;
    paidAt: Date | null;
    moneyBreakdown: BookingMoneyBreakdown | null;
  } | null;
  guestConfirmationEmailSentAt: Date | null;
  timeline: { at: Date; label: string; detail?: string }[];
  canCancel: boolean;
  canRefund: boolean;
};

export async function getHostBookingDetail(
  hostId: string,
  bookingId: string
): Promise<HostBookingDetail | null> {
  const b = await prisma.booking.findFirst({
    where: { id: bookingId, listing: { ownerId: hostId } },
    include: {
      listing: { select: { id: true, title: true, city: true } },
      guest: { select: { name: true, email: true, phone: true } },
      payment: true,
      bookingEvents: { orderBy: { createdAt: "asc" } },
    },
  });
  if (!b) return null;

  const pay = b.payment;
  const moneyBreakdown = pay ? parseMoneyBreakdown(pay.moneyBreakdownJson) : null;

  const canCancel = !NON_CANCELABLE.has(b.status);
  const canRefund =
    !!pay &&
    (pay.status === "COMPLETED" || pay.status === "PARTIALLY_REFUNDED") &&
    !!pay.stripePaymentId?.trim().startsWith("pi_");

  const timeline: HostBookingDetail["timeline"] = [];
  timeline.push({ at: b.createdAt, label: "Booking created" });
  if (pay?.paidAt) timeline.push({ at: pay.paidAt, label: "Payment received" });
  if (b.guestConfirmationEmailSentAt) {
    timeline.push({ at: b.guestConfirmationEmailSentAt, label: "Confirmation email sent" });
  }
  for (const ev of b.bookingEvents) {
    timeline.push({
      at: ev.createdAt,
      label: ev.eventType.replace(/_/g, " "),
      detail:
        ev.payload != null && typeof ev.payload === "object" && !Array.isArray(ev.payload)
          ? JSON.stringify(ev.payload)
          : undefined,
    });
  }
  if (b.canceledAt) {
    timeline.push({
      at: b.canceledAt,
      label: "Cancelled",
      detail: b.cancellationReason ?? undefined,
    });
  }
  timeline.sort((a, b) => a.at.getTime() - b.at.getTime());

  return {
    id: b.id,
    confirmationCode: b.confirmationCode,
    bookingCode: b.bookingCode,
    status: b.status,
    createdAt: b.createdAt,
    canceledAt: b.canceledAt,
    checkIn: b.checkIn,
    checkOut: b.checkOut,
    nights: b.nights,
    guestsCount: b.guestsCount,
    guestContactName: b.guestContactName,
    guestContactEmail: b.guestContactEmail,
    guestContactPhone: b.guestContactPhone,
    guest: b.guest,
    listing: b.listing,
    payment: pay
      ? {
          status: pay.status,
          amountCents: pay.amountCents,
          guestFeeCents: pay.guestFeeCents,
          hostFeeCents: pay.hostFeeCents,
          stripePaymentId: pay.stripePaymentId,
          paidAt: pay.paidAt,
          moneyBreakdown,
        }
      : null,
    guestConfirmationEmailSentAt: b.guestConfirmationEmailSentAt,
    timeline,
    canCancel,
    canRefund,
  };
}
