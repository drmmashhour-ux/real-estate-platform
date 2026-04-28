import type { SybnbBooking, SyriaAppUser } from "@/generated/prisma";

/** Reminder kinds emitted by `getReminderEvents` / cron (no payment links). */
export type SybnbReminderKind = "HOST_PENDING" | "PAYMENT_PENDING" | "CHECKIN_SOON";

const MESSAGE_TEMPLATE_ID: Record<SybnbReminderKind, string> = {
  HOST_PENDING: "Sybnb.reminders.hostPending",
  PAYMENT_PENDING: "Sybnb.reminders.paymentPending",
  CHECKIN_SOON: "Sybnb.reminders.checkinSoon",
};

/**
 * Stub delivery — replace with email/SMS later. Logs metadata only (IDs + kind); never logs secrets.
 */
export async function sendReminder(
  user: Pick<SyriaAppUser, "id">,
  reminderKind: SybnbReminderKind,
  booking: Pick<SybnbBooking, "id" | "status" | "paymentStatus" | "checkIn">,
): Promise<void> {
  console.log("[SYBNB_REMINDER]", {
    kind: reminderKind,
    messageTemplateId: MESSAGE_TEMPLATE_ID[reminderKind],
    bookingId: booking.id,
    recipientUserId: user.id,
    bookingStatus: booking.status,
    paymentStatus: booking.paymentStatus,
    checkIn: booking.checkIn.toISOString(),
    at: new Date().toISOString(),
  });
}
