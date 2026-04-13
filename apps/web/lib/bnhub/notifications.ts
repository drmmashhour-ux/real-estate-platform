/**
 * BNHUB notifications — trigger events for new booking, confirmation, cancellation, message, review reminder.
 * Implementations can push to a queue, send email, or call a webhook. This module provides the hooks.
 */

import { prisma } from "@/lib/db";

export type BNHubNotificationEvent =
  | { type: "new_booking"; bookingId: string; listingId: string; guestId: string; hostId: string }
  | { type: "booking_confirmation"; bookingId: string; guestId: string; hostId: string }
  | { type: "booking_cancellation"; bookingId: string; guestId: string; hostId: string; cancelledBy: "guest" | "host" | "admin" }
  | { type: "new_message"; bookingId: string; senderId: string; recipientId: string }
  | { type: "review_reminder"; bookingId: string; guestId: string; listingId: string };

type NotificationHandler = (event: BNHubNotificationEvent) => void | Promise<void>;

const handlers: NotificationHandler[] = [];

/**
 * Register a handler for BNHUB notification events (e.g. send email, push to queue).
 */
export function onBNHubNotification(handler: NotificationHandler) {
  handlers.push(handler);
}

/**
 * Trigger a notification. All registered handlers are invoked.
 * Handlers are not awaited; errors are logged and do not throw.
 */
export async function triggerBNHubNotification(event: BNHubNotificationEvent) {
  for (const h of handlers) {
    try {
      await Promise.resolve(h(event));
    } catch (e) {
      console.error("[BNHUB notification]", event.type, e);
    }
  }
}

/** New booking created (guest requested or instant-book). */
export function triggerNewBooking(payload: {
  bookingId: string;
  listingId: string;
  guestId: string;
  hostId: string;
}) {
  return triggerBNHubNotification({
    type: "new_booking",
    ...payload,
  });
}

/** Booking confirmed (payment completed). */
export function triggerBookingConfirmation(payload: {
  bookingId: string;
  guestId: string;
  hostId: string;
}) {
  return triggerBNHubNotification({
    type: "booking_confirmation",
    ...payload,
  });
}

/** Booking cancelled. */
export function triggerBookingCancellation(payload: {
  bookingId: string;
  guestId: string;
  hostId: string;
  cancelledBy: "guest" | "host" | "admin";
}) {
  return triggerBNHubNotification({
    type: "booking_cancellation",
    ...payload,
  });
}

/** New message in booking chat. */
export function triggerNewMessage(payload: {
  bookingId: string;
  senderId: string;
  recipientId: string;
}) {
  return triggerBNHubNotification({
    type: "new_message",
    ...payload,
  });
}

/** Remind guest to leave a review after stay (call when stay is completed or check-out date passed). */
export function triggerReviewReminder(payload: {
  bookingId: string;
  guestId: string;
  listingId: string;
}) {
  void triggerBNHubNotification({
    type: "review_reminder",
    ...payload,
  });
  /** Timed review asks + reminders run via `runBnhubGuestExperienceEngine` (cron: /api/internal/bnhub/guest-experience/run). */
}

onBNHubNotification(async (event) => {
  if (event.type !== "new_message") return;
  try {
    const booking = await prisma.booking.findUnique({
      where: { id: event.bookingId },
      select: {
        listing: { select: { id: true, title: true } },
      },
    });
    const preview =
      booking?.listing?.title?.trim().slice(0, 120) ?? "You have a new message about a stay.";
    await prisma.notification.create({
      data: {
        userId: event.recipientId,
        type: "MESSAGE",
        title: "New booking message",
        message: preview,
        priority: "NORMAL",
        actionUrl: `/bnhub/booking/${encodeURIComponent(event.bookingId)}`,
        actionLabel: "Open booking",
        listingId: booking?.listing?.id,
        metadata: { bookingId: event.bookingId, channel: "bnhub_booking_chat" } as object,
      },
    });
  } catch (e) {
    console.error("[BNHUB in-app notification] new_message", e);
  }
});
