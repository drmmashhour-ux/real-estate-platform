/**
 * Critical-path SMS for unreliable connectivity — low frequency, no secrets/links/PII in body.
 * Dedup: max one SMS per event kind + booking + recipient per 24h (`SybnbReminderLog.reminderType`).
 */

import { prisma } from "@/lib/db";
import { normalizeSmsRecipient, sendSMS, isSybnbSmsEnabled } from "@/lib/sybnb/sms";

/** Same window as in-app reminders (`reminders.ts`). */
export const SYBNB_SMS_COOLDOWN_MS = 24 * 3600 * 1000;

/** Distinct from cron reminder kinds — SMS-only log rows. */
export type SybnbSmsReminderType =
  | "sms_booking_approved"
  | "sms_payment_pending"
  | "sms_checkin_soon";

export const SMS_BOOKING_APPROVED =
  "Your booking is approved. Please contact the host to complete payment.";

export const SMS_PAYMENT_PENDING = "Reminder: Complete your booking payment with the host.";

export const SMS_CHECKIN_SOON = "Your stay is tomorrow. Ensure everything is confirmed.";

async function canSendSms(
  bookingId: string,
  reminderType: SybnbSmsReminderType,
  recipientUserId: string,
  now: Date,
): Promise<boolean> {
  const last = await prisma.sybnbReminderLog.findFirst({
    where: { bookingId, reminderType, recipientUserId },
    orderBy: { sentAt: "desc" },
    select: { sentAt: true },
  });
  if (!last) return true;
  return now.getTime() - last.sentAt.getTime() >= SYBNB_SMS_COOLDOWN_MS;
}

async function recordSmsSent(bookingId: string, reminderType: SybnbSmsReminderType, recipientUserId: string): Promise<void> {
  await prisma.sybnbReminderLog.create({
    data: {
      bookingId,
      reminderType,
      recipientUserId,
    },
  });
}

/** Host approved request — notify guest immediately (when SMS enabled + guest phone on file). */
export async function notifyGuestBookingApprovedSms(bookingId: string): Promise<void> {
  if (!isSybnbSmsEnabled()) return;

  const now = new Date();
  const b = await prisma.sybnbBooking.findUnique({
    where: { id: bookingId },
    select: {
      id: true,
      isTest: true,
      guestId: true,
      guest: { select: { phone: true } },
    },
  });
  if (!b || b.isTest) return;

  const phone = normalizeSmsRecipient(b.guest.phone);
  if (!phone) return;

  const recipientUserId = b.guestId;
  if (!(await canSendSms(b.id, "sms_booking_approved", recipientUserId, now))) return;

  await sendSMS(phone, SMS_BOOKING_APPROVED);
  await recordSmsSent(b.id, "sms_booking_approved", recipientUserId);
}

/** Cron: guest overdue manual payment — aligned with {@link PAYMENT_PENDING} cron branch. */
export async function notifyGuestPaymentPendingSms(bookingId: string): Promise<void> {
  if (!isSybnbSmsEnabled()) return;

  const now = new Date();
  const b = await prisma.sybnbBooking.findUnique({
    where: { id: bookingId },
    select: {
      id: true,
      isTest: true,
      guestId: true,
      guest: { select: { phone: true } },
    },
  });
  if (!b || b.isTest) return;

  const phone = normalizeSmsRecipient(b.guest.phone);
  if (!phone) return;

  const recipientUserId = b.guestId;
  if (!(await canSendSms(b.id, "sms_payment_pending", recipientUserId, now))) return;

  await sendSMS(phone, SMS_PAYMENT_PENDING);
  await recordSmsSent(b.id, "sms_payment_pending", recipientUserId);
}

/** Check-in within 24h — notify guest and host once each per cooldown window. */
export async function notifyCheckinSoonSms(bookingId: string): Promise<void> {
  if (!isSybnbSmsEnabled()) return;

  const now = new Date();
  const b = await prisma.sybnbBooking.findUnique({
    where: { id: bookingId },
    select: {
      id: true,
      isTest: true,
      guestId: true,
      hostId: true,
      guest: { select: { phone: true } },
      host: { select: { phone: true } },
    },
  });
  if (!b || b.isTest) return;

  const recipients: { userId: string; phone: string | null }[] = [
    { userId: b.guestId, phone: b.guest.phone },
    { userId: b.hostId, phone: b.host.phone },
  ];

  for (const r of recipients) {
    const phone = normalizeSmsRecipient(r.phone);
    if (!phone) continue;
    if (!(await canSendSms(b.id, "sms_checkin_soon", r.userId, now))) continue;
    await sendSMS(phone, SMS_CHECKIN_SOON);
    await recordSmsSent(b.id, "sms_checkin_soon", r.userId);
  }
}
