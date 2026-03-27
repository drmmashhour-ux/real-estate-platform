import type { PlatformRole } from "@prisma/client";
import { NotificationType } from "@prisma/client";
import { prisma } from "@/lib/db";

const ROLES_SKIP_BNHUB_NUDGES: PlatformRole[] = ["ADMIN", "MORTGAGE_EXPERT", "ACCOUNTANT"];

export async function recordBnhubAutomationEvent(args: {
  userId?: string | null;
  bookingId?: string | null;
  trigger: string;
  dedupeKey?: string | null;
  meta?: Record<string, unknown>;
}) {
  if (args.dedupeKey) {
    const existing = await prisma.bnhubAutomationEvent.findUnique({
      where: { dedupeKey: args.dedupeKey },
    });
    if (existing) return null;
  }
  return prisma.bnhubAutomationEvent.create({
    data: {
      userId: args.userId ?? undefined,
      bookingId: args.bookingId ?? undefined,
      trigger: args.trigger,
      dedupeKey: args.dedupeKey ?? undefined,
      meta: args.meta as object | undefined,
    },
  });
}

async function notifyGrowth(userId: string, title: string, message: string, actionUrl: string, actionLabel: string) {
  await prisma.notification
    .create({
      data: {
        userId,
        type: NotificationType.SYSTEM,
        title,
        message,
        actionUrl,
        actionLabel,
        metadata: { source: "bnhub_growth" } as object,
      },
    })
    .catch(() => {});
}

/** After signup — suggest exploring listings (deduped per user). */
export async function runBnhubPostSignupAutomation(userId: string, role: PlatformRole) {
  if (ROLES_SKIP_BNHUB_NUDGES.includes(role)) return;
  const dedupeKey = `signup_listings:${userId}`;
  const recorded = await recordBnhubAutomationEvent({
    userId,
    trigger: "signup_suggest_listings",
    dedupeKey,
    meta: { role },
  });
  if (!recorded) return;
  await notifyGrowth(
    userId,
    "Find your next stay on BNHub",
    "Browse curated short-term stays and save your favorites.",
    "/bnhub",
    "Browse stays"
  );
}

/** After payment confirms booking — upsell add-ons / services (deduped per booking). */
export async function runBnhubPostBookingPaidAutomation(bookingId: string) {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    select: {
      guestId: true,
      listing: { select: { title: true, city: true } },
    },
  });
  if (!booking) return;
  const dedupeKey = `booking_upsell:${bookingId}`;
  const recorded = await recordBnhubAutomationEvent({
    userId: booking.guestId,
    bookingId,
    trigger: "booking_confirmed_upsell",
    dedupeKey,
    meta: { listingTitle: booking.listing.title },
  });
  if (!recorded) return;
  const place = booking.listing.city ? ` in ${booking.listing.city}` : "";
  await notifyGrowth(
    booking.guestId,
    "Enhance your trip",
    `Add airport pickup, late check-in, or other extras for your stay${place}.`,
    `/bnhub/booking/${bookingId}`,
    "View booking"
  );
}

/** After stay completes — align with review flow (deduped). */
export async function runBnhubStayCompletedAutomation(bookingId: string, guestId: string) {
  const dedupeKey = `stay_completed_review:${bookingId}`;
  await recordBnhubAutomationEvent({
    userId: guestId,
    bookingId,
    trigger: "stay_completed_review_prompt",
    dedupeKey,
  });
  // Review email/in-app already handled by triggerReviewReminder in booking flow.
}

/**
 * Remind users who signed up but never booked (admin/cron). Deduped per user.
 * @returns number of notifications sent
 */
export async function processBnhubNoBookingReminders(options?: { olderThanDays?: number; limit?: number }) {
  const olderThanDays = options?.olderThanDays ?? 3;
  const limit = Math.min(200, Math.max(1, options?.limit ?? 50));
  const cutoff = new Date(Date.now() - olderThanDays * 24 * 60 * 60 * 1000);

  const candidates = await prisma.user.findMany({
    where: {
      createdAt: { lte: cutoff },
      bookingsAsGuest: { none: {} },
      role: { notIn: ROLES_SKIP_BNHUB_NUDGES },
    },
    select: { id: true },
    take: limit,
    orderBy: { createdAt: "asc" },
  });

  let sent = 0;
  for (const u of candidates) {
    const dedupeKey = `no_booking_reminder:${u.id}`;
    const recorded = await recordBnhubAutomationEvent({
      userId: u.id,
      trigger: "no_booking_reminder",
      dedupeKey,
    });
    if (!recorded) continue;
    await notifyGrowth(
      u.id,
      "Still planning a trip?",
      "Discover BNHub stays — flexible dates and instant book options.",
      "/bnhub",
      "Explore BNHub"
    );
    sent += 1;
  }
  return sent;
}
