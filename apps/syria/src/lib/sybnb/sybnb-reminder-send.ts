import type { SybnbBooking, SyriaAppUser } from "@/generated/prisma";

/** Reminder kinds emitted by `getReminderEvents` / cron (no payment links). */
export type SybnbReminderKind = "HOST_PENDING" | "PAYMENT_PENDING" | "CHECKIN_SOON";

/**
 * Keys under `Sybnb.reminders` (next-intl). Keep English preview strings in sync with `messages/en.json`.
 */
export const SYBNB_REMINDER_MESSAGE_KEYS: Record<SybnbReminderKind, "hostPending" | "paymentPending" | "checkinSoon"> = {
  HOST_PENDING: "hostPending",
  PAYMENT_PENDING: "paymentPending",
  CHECKIN_SOON: "checkinSoon",
};

/** English copy for logs / future providers — mirrors Sybnb.reminders.* (en). */
export const SYBNB_REMINDER_PREVIEW_EN: Record<SybnbReminderKind, string> = {
  HOST_PENDING: "You have a new booking request waiting for approval.",
  PAYMENT_PENDING: "Your booking is approved. Please complete payment with the host.",
  CHECKIN_SOON: "Your stay is approaching. Ensure payment is completed.",
};

/**
 * Stub delivery — replace with email/SMS later.
 * Logs IDs + kind + template keys only (no secrets, no payment URLs).
 */
export async function sendReminder(
  user: Pick<SyriaAppUser, "id">,
  reminderKind: SybnbReminderKind,
  booking: Pick<SybnbBooking, "id" | "status" | "paymentStatus" | "checkIn">,
): Promise<void> {
  const nsKey = SYBNB_REMINDER_MESSAGE_KEYS[reminderKind];
  console.log("[SYBNB_REMINDER]", {
    kind: reminderKind,
    i18nKey: `Sybnb.reminders.${nsKey}`,
    messagePreviewEn: SYBNB_REMINDER_PREVIEW_EN[reminderKind],
    bookingId: booking.id,
    recipientUserId: user.id,
    bookingStatus: booking.status,
    paymentStatus: booking.paymentStatus,
    checkIn: booking.checkIn.toISOString(),
    at: new Date().toISOString(),
  });
}
