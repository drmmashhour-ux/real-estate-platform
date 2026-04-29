import type { SybnbBooking } from "@/generated/prisma";
import { prisma } from "@/lib/db";
import { sybnbBookingPaymentSettled } from "@/lib/sybnb/booking-timeline";
import { sendReminder, type SybnbReminderKind } from "@/lib/sybnb/sybnb-reminder-send";

export type { SybnbReminderKind };

const MS_H = 3600000;
/** Max one delivery per booking + reminder kind + recipient within this window (spam guard). */
export const SYBNB_REMINDER_COOLDOWN_MS = 24 * MS_H;

function subHours(base: Date, hours: number): Date {
  return new Date(base.getTime() - hours * MS_H);
}

function addHours(base: Date, hours: number): Date {
  return new Date(base.getTime() + hours * MS_H);
}

function manualPaymentPhaseStale(booking: Pick<SybnbBooking, "status" | "paymentStatus" | "approvedAt" | "updatedAt">, now: Date): boolean {
  if (booking.status !== "approved" || booking.paymentStatus !== "manual_required") {
    return false;
  }
  const anchor = booking.approvedAt ?? booking.updatedAt;
  return anchor.getTime() <= subHours(now, 24).getTime();
}

/**
 * Pure rule evaluation — which reminder kinds apply right now (before rate limiting).
 *
 * Rules (aligned with SYBNB booking timeline payment predicate via {@link sybnbBookingPaymentSettled}):
 * - **HOST_PENDING**: `status === requested` and request open ≥24h (`createdAt` not newer than `now - 24h`).
 * - **PAYMENT_PENDING**: `approved` + `manual_required` and approval anchor ≥24h (`approvedAt` or fallback `updatedAt`).
 * - **CHECKIN_SOON**: upcoming check-in within 48h, payment not settled, not terminal negative states.
 */
export function getReminderEvents(
  booking: Pick<SybnbBooking, "status" | "paymentStatus" | "createdAt" | "checkIn" | "approvedAt" | "updatedAt">,
  now: Date = new Date(),
): SybnbReminderKind[] {
  const out: SybnbReminderKind[] = [];

  if (
    booking.status === "requested" &&
    booking.createdAt.getTime() <= subHours(now, 24).getTime()
  ) {
    out.push("HOST_PENDING");
  }

  if (manualPaymentPhaseStale(booking, now)) {
    out.push("PAYMENT_PENDING");
  }

  const checkIn = booking.checkIn;
  if (
    checkIn.getTime() > now.getTime() &&
    checkIn.getTime() <= addHours(now, 48).getTime() &&
    !sybnbBookingPaymentSettled(booking) &&
    booking.status !== "declined" &&
    booking.status !== "cancelled" &&
    booking.status !== "refunded"
  ) {
    out.push("CHECKIN_SOON");
  }

  return out;
}

async function canSendReminder(
  bookingId: string,
  reminderKind: SybnbReminderKind,
  recipientUserId: string,
  now: Date,
): Promise<boolean> {
  const last = await prisma.sybnbReminderLog.findFirst({
    where: { bookingId, reminderType: reminderKind, recipientUserId },
    orderBy: { sentAt: "desc" },
    select: { sentAt: true },
  });
  if (!last) {
    return true;
  }
  return now.getTime() - last.sentAt.getTime() >= SYBNB_REMINDER_COOLDOWN_MS;
}

/** Cron worker: scan eligible bookings, respect 24h caps, append log rows. */
export async function runSybnbRemindersCron(now: Date = new Date()): Promise<{
  scanned: number;
  deliveries: { bookingId: string; kind: SybnbReminderKind; recipientUserId: string }[];
}> {
  const threshold = subHours(now, 24);
  const checkInUpper = addHours(now, 48);

  const bookings = await prisma.sybnbBooking.findMany({
    where: {
      OR: [
        { status: "requested", createdAt: { lte: threshold } },
        {
          status: "approved",
          paymentStatus: "manual_required",
          OR: [{ approvedAt: { lte: threshold } }, { approvedAt: null, updatedAt: { lte: threshold } }],
        },
        {
          checkIn: { gt: now, lte: checkInUpper },
          status: { notIn: ["declined", "cancelled", "completed", "refunded"] },
          NOT: {
            OR: [
              { paymentStatus: "paid" },
              { status: "confirmed" },
              { status: "completed" },
              { status: "paid" },
            ],
          },
        },
      ],
      isTest: false,
    },
    take: 800,
  });

  const deliveries: { bookingId: string; kind: SybnbReminderKind; recipientUserId: string }[] = [];

  for (const b of bookings) {
    const kinds = getReminderEvents(b, now);
    for (const kind of kinds) {
      if (kind === "HOST_PENDING") {
        const uid = b.hostId;
        if (!(await canSendReminder(b.id, kind, uid, now))) continue;
        await sendReminder({ id: uid }, kind, b);
        await prisma.sybnbReminderLog.create({
          data: {
            bookingId: b.id,
            reminderType: kind,
            recipientUserId: uid,
          },
        });
        deliveries.push({ bookingId: b.id, kind, recipientUserId: uid });
      } else if (kind === "PAYMENT_PENDING") {
        const uid = b.guestId;
        if (!(await canSendReminder(b.id, kind, uid, now))) continue;
        await sendReminder({ id: uid }, kind, b);
        await prisma.sybnbReminderLog.create({
          data: {
            bookingId: b.id,
            reminderType: kind,
            recipientUserId: uid,
          },
        });
        deliveries.push({ bookingId: b.id, kind, recipientUserId: uid });
      } else if (kind === "CHECKIN_SOON") {
        for (const uid of [b.guestId, b.hostId]) {
          if (!(await canSendReminder(b.id, kind, uid, now))) continue;
          await sendReminder({ id: uid }, kind, b);
          await prisma.sybnbReminderLog.create({
            data: {
              bookingId: b.id,
              reminderType: kind,
              recipientUserId: uid,
            },
          });
          deliveries.push({ bookingId: b.id, kind, recipientUserId: uid });
        }
      }
    }
  }

  return { scanned: bookings.length, deliveries };
}
