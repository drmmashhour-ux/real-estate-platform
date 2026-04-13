import {
  BookingStatus,
  ListingStatus,
  NotificationPriority,
  NotificationType,
  SearchEventType,
  VerificationStatus,
} from "@prisma/client";
import { prisma } from "@/lib/db";
import { buildUserSearchProfileFromEvents } from "@/lib/ai/search/buildUserProfile";

const RETENTION_META_BROWSE = "bnhub_browse_nudge" as const;
const RETENTION_META_NEW = "bnhub_new_listings_digest" as const;
const RETENTION_META_POST_BOOK = "bnhub_post_booking_next_steps" as const;

function hoursAgo(h: number): Date {
  return new Date(Date.now() - h * 3600000);
}

async function hasRecentRetentionNotification(userId: string, kind: string, withinHours: number): Promise<boolean> {
  const since = hoursAgo(withinHours);
  const rows = await prisma.notification.findMany({
    where: { userId, createdAt: { gte: since } },
    select: { metadata: true },
    take: 40,
  });
  return rows.some((r) => {
    const m = r.metadata as { retentionKind?: string } | null;
    return m?.retentionKind === kind;
  });
}

/**
 * In-app nudge: guest viewed a stay 18–72h ago, no booking since, not nudged in 7 days.
 */
export async function runBnhubBrowseFollowUpBatch(): Promise<{ created: number; skipped: number }> {
  const windowStart = hoursAgo(72);
  const windowEnd = hoursAgo(18);
  let created = 0;
  let skipped = 0;

  const recentViews = await prisma.searchEvent.findMany({
    where: {
      eventType: SearchEventType.VIEW,
      userId: { not: null },
      listingId: { not: null },
      createdAt: { gte: windowStart, lte: windowEnd },
    },
    orderBy: { createdAt: "desc" },
    take: 400,
    select: { userId: true, listingId: true, createdAt: true },
  });

  const latestByUser = new Map<string, { listingId: string; userId: string }>();
  for (const row of recentViews) {
    const uid = row.userId;
    const lid = row.listingId;
    if (!uid || !lid) continue;
    if (!latestByUser.has(uid)) {
      latestByUser.set(uid, { userId: uid, listingId: lid });
    }
  }

  for (const { userId, listingId } of latestByUser.values()) {
    if (await hasRecentRetentionNotification(userId, RETENTION_META_BROWSE, 24 * 7)) {
      skipped += 1;
      continue;
    }

    const booked = await prisma.booking.findFirst({
      where: {
        guestId: userId,
        createdAt: { gte: hoursAgo(96) },
        status: { in: [BookingStatus.PENDING, BookingStatus.CONFIRMED, BookingStatus.COMPLETED, BookingStatus.AWAITING_HOST_APPROVAL] },
      },
      select: { id: true },
    });
    if (booked) {
      skipped += 1;
      continue;
    }

    const listing = await prisma.shortTermListing.findFirst({
      where: { id: listingId, listingStatus: ListingStatus.PUBLISHED },
      select: { id: true, title: true, city: true },
    });
    if (!listing) {
      skipped += 1;
      continue;
    }

    await buildUserSearchProfileFromEvents(userId).catch(() => {});

    await prisma.notification.create({
      data: {
        userId,
        type: NotificationType.REMINDER,
        title: "Still planning your trip?",
        message: `You recently viewed ${listing.title} in ${listing.city}. Finish booking or explore similar stays.`,
        actionUrl: `/bnhub/listings/${listing.id}`,
        actionLabel: "View listing",
        listingId: listing.id,
        priority: NotificationPriority.LOW,
        metadata: { retentionKind: RETENTION_META_BROWSE, listingId: listing.id } as object,
      },
    });
    created += 1;
  }

  return { created, skipped };
}

/**
 * Weekly-style digest: new verified listings in cities the guest cares about (from `UserSearchProfile`).
 */
export async function runBnhubNewListingsDigestBatch(): Promise<{ created: number; skipped: number }> {
  let created = 0;
  let skipped = 0;
  const since = hoursAgo(24 * 5);

  const fresh = await prisma.shortTermListing.findMany({
    where: {
      listingStatus: ListingStatus.PUBLISHED,
      verificationStatus: VerificationStatus.VERIFIED,
      createdAt: { gte: since },
    },
    orderBy: { createdAt: "desc" },
    take: 24,
    select: { id: true, title: true, city: true, createdAt: true },
  });

  if (fresh.length === 0) return { created: 0, skipped: 0 };

  const profiles = await prisma.userSearchProfile.findMany({
    where: { preferredCities: { isEmpty: false } },
    select: { userId: true, preferredCities: true },
    take: 200,
  });

  for (const p of profiles) {
    if (await hasRecentRetentionNotification(p.userId, RETENTION_META_NEW, 24 * 6)) {
      skipped += 1;
      continue;
    }

    const citySet = new Set(p.preferredCities.map((c) => c.trim().toLowerCase()).filter(Boolean));
    const match = fresh.find((l) => citySet.has(l.city.trim().toLowerCase()));
    if (!match) {
      skipped += 1;
      continue;
    }

    await prisma.notification.create({
      data: {
        userId: p.userId,
        type: NotificationType.SYSTEM,
        title: "New stays in your areas",
        message: `${match.title} just went live in ${match.city}. See what’s new on BNHUB.`,
        actionUrl: `/bnhub/stays?city=${encodeURIComponent(match.city)}`,
        actionLabel: "Browse stays",
        listingId: match.id,
        priority: NotificationPriority.LOW,
        metadata: { retentionKind: RETENTION_META_NEW, listingId: match.id } as object,
      },
    });
    created += 1;
  }

  return { created, skipped };
}

/**
 * Single in-app message after payment clears — complements email lifecycle.
 */
export async function createBnhubPostBookingRetentionNotification(bookingId: string): Promise<void> {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    select: {
      guestId: true,
      listingId: true,
      listing: { select: { title: true } },
    },
  });
  if (!booking) return;

  if (await hasRecentRetentionNotification(booking.guestId, RETENTION_META_POST_BOOK, 2)) {
    return;
  }

  await prisma.notification.create({
    data: {
      userId: booking.guestId,
      type: NotificationType.REMINDER,
      title: "You’re all set — next steps",
      message: `Your stay at ${booking.listing.title} is confirmed. View trip details, check-in info, and host messages anytime.`,
      actionUrl: `/bnhub/booking/${bookingId}`,
      actionLabel: "Open booking",
      listingId: booking.listingId,
      priority: NotificationPriority.NORMAL,
      metadata: { retentionKind: RETENTION_META_POST_BOOK, bookingId } as object,
    },
  });
}
