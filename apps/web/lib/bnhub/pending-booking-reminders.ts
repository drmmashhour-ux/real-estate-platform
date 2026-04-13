import { BookingStatus, NotificationPriority, NotificationType } from "@prisma/client";
import { prisma } from "@/lib/db";

const REMINDER_TITLE = "Complete your stay booking";

export type PendingBookingReminderResult = {
  scanned: number;
  sent: number;
  skipped: number;
};

/**
 * In-app nudge for guests with unpaid / unconfirmed `PENDING` bookings after a quiet period.
 * Idempotent per booking via notification title + action URL match.
 */
export async function sendBnhubPendingBookingReminders(options?: {
  minAgeMs?: number;
  maxAgeMs?: number;
  batchSize?: number;
}): Promise<PendingBookingReminderResult> {
  const minAgeMs = options?.minAgeMs ?? 2 * 60 * 60 * 1000;
  const maxAgeMs = options?.maxAgeMs ?? 7 * 24 * 60 * 60 * 1000;
  const batchSize = options?.batchSize ?? 40;

  const now = Date.now();
  const minCreated = new Date(now - maxAgeMs);
  const maxCreated = new Date(now - minAgeMs);

  const pending = await prisma.booking.findMany({
    where: {
      status: BookingStatus.PENDING,
      createdAt: { gte: minCreated, lte: maxCreated },
    },
    select: {
      id: true,
      guestId: true,
      listingId: true,
      listing: { select: { title: true, listingCode: true } },
    },
    take: batchSize,
    orderBy: { createdAt: "asc" },
  });

  let sent = 0;
  let skipped = 0;

  for (const b of pending) {
    const actionUrl = `/bnhub/booking/${b.id}`;
    const dup = await prisma.notification.findFirst({
      where: {
        userId: b.guestId,
        title: REMINDER_TITLE,
        actionUrl: { contains: `/bnhub/booking/${b.id}` },
      },
      select: { id: true },
    });
    if (dup) {
      skipped += 1;
      continue;
    }

    const label = b.listing.title?.trim() || b.listing.listingCode || "Your stay";
    await prisma.notification.create({
      data: {
        userId: b.guestId,
        type: NotificationType.REMINDER,
        priority: NotificationPriority.NORMAL,
        title: REMINDER_TITLE,
        message: `Finish checkout for “${label.slice(0, 80)}${label.length > 80 ? "…" : ""}” before the hold expires.`,
        actionUrl,
        actionLabel: "Continue booking",
        listingId: b.listingId,
        metadata: { source: "bnhub_pending_booking_reminder", bookingId: b.id } as object,
      },
    });
    sent += 1;
  }

  return { scanned: pending.length, sent, skipped };
}
