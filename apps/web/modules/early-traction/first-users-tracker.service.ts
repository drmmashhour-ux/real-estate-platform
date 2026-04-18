import { BookingStatus, ListingStatus, PlatformRole } from "@prisma/client";
import { prisma } from "@/lib/db";
import type { SignupAttributionPayload } from "@/lib/attribution/signup-attribution";
import type {
  ActivationKey,
  EarlyTractionSnapshot,
  FirstUserRow,
  UserCategory,
} from "./early-traction.types";

function channelFromJson(raw: unknown): FirstUserRow["acquisitionChannel"] {
  if (raw == null) return "unknown";
  if (typeof raw === "object" && raw !== null && "channel" in raw) {
    const c = (raw as SignupAttributionPayload).channel;
    if (
      c === "tiktok" ||
      c === "instagram" ||
      c === "facebook" ||
      c === "outreach" ||
      c === "direct" ||
      c === "organic" ||
      c === "other"
    ) {
      return c;
    }
  }
  return "unknown";
}

function categoryFromRole(role: PlatformRole): UserCategory {
  if (role === PlatformRole.HOST) return "bnhub_host";
  if (role === PlatformRole.BROKER) return "broker";
  if (role === PlatformRole.BUYER) return "buyer";
  if (role === PlatformRole.SELLER_DIRECT) return "seller";
  if (role === PlatformRole.USER || role === PlatformRole.CLIENT) return "guest";
  return "other";
}

const BOOKING_ACTIVATION: BookingStatus[] = [
  BookingStatus.CONFIRMED,
  BookingStatus.COMPLETED,
  BookingStatus.AWAITING_HOST_APPROVAL,
  BookingStatus.PENDING,
];

export async function buildFirstUsersSnapshot(sampleSize = 100): Promise<EarlyTractionSnapshot> {
  const totalUsers = await prisma.user.count();

  const users = await prisma.user.findMany({
    orderBy: { createdAt: "asc" },
    take: sampleSize,
    select: {
      id: true,
      email: true,
      role: true,
      createdAt: true,
      updatedAt: true,
      signupAttributionJson: true,
      bnhubGuestTotalStays: true,
    },
  });

  const ids = users.map((u) => u.id);
  if (ids.length === 0) {
    return {
      generatedAt: new Date().toISOString(),
      totalUsers,
      milestones: {
        hundred: { target: 100, progressCount: totalUsers, complete: totalUsers >= 100 },
        thousand: { target: 1000, progressCount: totalUsers, complete: totalUsers >= 1000 },
      },
      activatedCounts: {
        hostListingPublished: 0,
        guestBooking: 0,
        brokerDeal: 0,
        buyerInquiry: 0,
      },
      firstUsersSample: [],
      disclaimers: [
        "Counts are from production User / Booking / Lead / Deal / ShortTermListing tables.",
        "Retention is a heuristic (updatedAt vs createdAt, stay counts) — not a formal cohort study.",
      ],
    };
  }

  const [publishedHosts, guestIds, brokerIds, buyerLeadIds, bookingCounts] = await Promise.all([
    prisma.shortTermListing.findMany({
      where: { ownerId: { in: ids }, listingStatus: ListingStatus.PUBLISHED },
      select: { ownerId: true },
      distinct: ["ownerId"],
    }),
    prisma.booking.findMany({
      where: { guestId: { in: ids }, status: { in: BOOKING_ACTIVATION } },
      select: { guestId: true },
      distinct: ["guestId"],
    }),
    prisma.deal.findMany({
      where: {
        brokerId: { in: ids },
        status: { notIn: ["cancelled"] },
      },
      select: { brokerId: true },
      distinct: ["brokerId"],
    }),
    prisma.lead.findMany({
      where: { userId: { in: ids } },
      select: { userId: true },
      distinct: ["userId"],
    }),
    prisma.booking.groupBy({
      by: ["guestId"],
      where: { guestId: { in: ids } },
      _count: { _all: true },
    }),
  ]);

  const publishedSet = new Set(publishedHosts.map((p) => p.ownerId));
  const guestSet = new Set(guestIds.map((g) => g.guestId));
  const brokerSet = new Set(brokerIds.map((b) => b.brokerId!).filter(Boolean));
  const buyerSet = new Set(buyerLeadIds.map((l) => l.userId!).filter(Boolean));
  const bookingCountMap = new Map(bookingCounts.map((b) => [b.guestId, b._count._all]));

  const activatedCounts = {
    hostListingPublished: publishedSet.size,
    guestBooking: guestSet.size,
    brokerDeal: brokerSet.size,
    buyerInquiry: buyerSet.size,
  };

  const firstUsersSample: FirstUserRow[] = users.map((u) => {
    const category = categoryFromRole(u.role);
    const emailSuffix = u.email.includes("@") ? `…${u.email.slice(-6)}` : "…";

    let key: ActivationKey = "none";
    let achieved = false;
    let detail: string | undefined;

    if (publishedSet.has(u.id)) {
      key = "host_first_listing_published";
      achieved = true;
      detail = "Published BNHub listing";
    } else if (guestSet.has(u.id)) {
      key = "guest_first_booking";
      achieved = true;
      detail = "Booking pipeline row as guest";
    } else if (brokerSet.has(u.id)) {
      key = "broker_first_deal";
      achieved = true;
      detail = "Deal assigned as broker";
    } else if (buyerSet.has(u.id)) {
      key = "buyer_first_inquiry";
      achieved = true;
      detail = "CRM lead linked to user";
    }

    const msSinceSignup = u.updatedAt.getTime() - u.createdAt.getTime();
    const multiBook = (bookingCountMap.get(u.id) ?? 0) > 1;
    const likelyReturned = multiBook || u.bnhubGuestTotalStays > 1 || msSinceSignup > 86_400_000 * 2;

    return {
      userId: u.id,
      emailSuffix,
      role: u.role,
      category,
      createdAt: u.createdAt.toISOString(),
      acquisitionChannel: channelFromJson(u.signupAttributionJson),
      activation: { key, achieved, detail },
      retention: {
        likelyReturned,
        notes: multiBook
          ? "Multiple bookings as guest"
          : u.bnhubGuestTotalStays > 1
            ? "Multiple completed stays (counter)"
            : msSinceSignup > 86_400_000 * 2
              ? "Account activity after signup window"
              : "No strong return signal yet",
      },
    };
  });

  return {
    generatedAt: new Date().toISOString(),
    totalUsers,
    milestones: {
      hundred: { target: 100, progressCount: totalUsers, complete: totalUsers >= 100 },
      thousand: { target: 1000, progressCount: totalUsers, complete: totalUsers >= 1000 },
    },
    activatedCounts,
    firstUsersSample,
    disclaimers: [
      "Sample is the earliest signups by `User.createdAt` (not “best customers”).",
      "Activation rules use internal CRM/BNHub rows only.",
      "Email shown as truncated hash for privacy in internal founder tools.",
    ],
  };
}
