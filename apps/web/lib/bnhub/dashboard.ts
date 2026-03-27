import { prisma } from "@/lib/db";

/** Bookings where checkIn falls in the current month (host's listings). */
export async function getBookingsThisMonth(ownerId: string): Promise<number> {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

  const count = await prisma.booking.count({
    where: {
      listing: { ownerId },
      checkIn: { gte: start, lte: end },
      status: { in: ["CONFIRMED", "PENDING", "COMPLETED", "AWAITING_HOST_APPROVAL"] },
    },
  });
  return count;
}

/** Bookings with checkIn in the next 7 days (confirmed). */
export async function getUpcomingGuests(ownerId: string): Promise<number> {
  const now = new Date();
  const in7 = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  const count = await prisma.booking.count({
    where: {
      listing: { ownerId },
      checkIn: { gte: now, lte: in7 },
      status: "CONFIRMED",
    },
  });
  return count;
}

/** Revenue MTD: sum of hostPayoutCents for completed payments where booking checkIn is in current month. */
export async function getRevenueMTD(ownerId: string): Promise<number> {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

  const result = await prisma.payment.aggregate({
    where: {
      status: "COMPLETED",
      booking: {
        listing: { ownerId },
        checkIn: { gte: start, lte: end },
      },
    },
    _sum: { hostPayoutCents: true },
  });
  return result._sum.hostPayoutCents ?? 0;
}

/** Revenue for a given month (start/end). */
export async function getRevenueForMonth(
  ownerId: string,
  year: number,
  month: number
): Promise<number> {
  const start = new Date(year, month, 1);
  const end = new Date(year, month + 1, 0, 23, 59, 59, 999);

  const result = await prisma.payment.aggregate({
    where: {
      status: "COMPLETED",
      booking: {
        listing: { ownerId },
        checkIn: { gte: start, lte: end },
      },
    },
    _sum: { hostPayoutCents: true },
  });
  return result._sum.hostPayoutCents ?? 0;
}

/** YTD revenue. */
export async function getRevenueYTD(ownerId: string): Promise<number> {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 1);
  const end = new Date();

  const result = await prisma.payment.aggregate({
    where: {
      status: "COMPLETED",
      booking: {
        listing: { ownerId },
        checkIn: { gte: start, lte: end },
      },
    },
    _sum: { hostPayoutCents: true },
  });
  return result._sum.hostPayoutCents ?? 0;
}

/**
 * Occupancy rate (last 30 days): (total booked nights / total available nights) * 100.
 * Total available = 30 * number of listings (each listing has 30 nights available).
 * Total booked = sum of nights for CONFIRMED/COMPLETED bookings that overlap the last 30 days.
 */
export async function getOccupancyRateLast30(ownerId: string): Promise<number> {
  const listings = await prisma.shortTermListing.count({
    where: { ownerId, listingStatus: "PUBLISHED" },
  });
  if (listings === 0) return 0;

  const now = new Date();
  const periodStart = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const bookings = await prisma.booking.findMany({
    where: {
      listing: { ownerId },
      status: { in: ["CONFIRMED", "COMPLETED"] },
      checkOut: { gt: periodStart },
      checkIn: { lt: now },
    },
    select: { checkIn: true, checkOut: true, nights: true },
  });

  let bookedNights = 0;
  for (const b of bookings) {
    const overlapStart = b.checkIn < periodStart ? periodStart : b.checkIn;
    const overlapEnd = b.checkOut > now ? now : b.checkOut;
    const days = Math.max(0, Math.ceil((overlapEnd.getTime() - overlapStart.getTime()) / (24 * 60 * 60 * 1000)));
    bookedNights += days;
  }

  const totalAvailable = 30 * listings;
  if (totalAvailable === 0) return 0;
  return Math.round((bookedNights / totalAvailable) * 100);
}

const HOST_FEE_PERCENT = 0.03;
const GUEST_FEE_PERCENT = 0.12;

function feeCents(totalCents: number) {
  return {
    guestFeeCents: Math.round(totalCents * GUEST_FEE_PERCENT),
    hostFeeCents: Math.round(totalCents * HOST_FEE_PERCENT),
    hostPayoutCents: totalCents - Math.round(totalCents * HOST_FEE_PERCENT),
    guestTotalCents: totalCents + Math.round(totalCents * GUEST_FEE_PERCENT),
  };
}

/** Ensure 3–5 demo bookings for a host: current month, upcoming (next 7 days), different prices. */
export async function ensureDemoBookings(ownerId: string): Promise<void> {
  const listingIds = await prisma.shortTermListing.findMany({
    where: { ownerId },
    select: { id: true },
    take: 3,
  });
  if (listingIds.length === 0) return;

  const count = await prisma.booking.count({
    where: { listing: { ownerId } },
  });
  if (count > 0) return;

  const guests = await prisma.user.findMany({
    where: { id: { not: ownerId } },
    select: { id: true },
    take: 3,
  });
  const guestId = guests[0]?.id ?? ownerId;

  const now = new Date();
  const listingId = listingIds[0].id;
  const listing = await prisma.shortTermListing.findUnique({
    where: { id: listingId },
    select: { nightPriceCents: true },
  });
  const baseNightCents = listing?.nightPriceCents ?? 12000;

  // 3–5 sample bookings: current month, upcoming (next 7 days), different prices
  type DemoBooking = {
    checkIn: Date;
    nights: number;
    nightPriceCents: number;
    status: "CONFIRMED" | "PENDING" | "AWAITING_HOST_APPROVAL";
    withPayment?: boolean;
  };

  const demos: DemoBooking[] = [
    // Current month – confirmed, mid price
    {
      checkIn: new Date(now.getFullYear(), now.getMonth(), 5),
      nights: 2,
      nightPriceCents: baseNightCents,
      status: "CONFIRMED",
      withPayment: true,
    },
    // Current month – pending
    {
      checkIn: new Date(now.getFullYear(), now.getMonth(), 18),
      nights: 4,
      nightPriceCents: Math.round(baseNightCents * 1.2),
      status: "PENDING",
    },
    // Upcoming (next 7 days) – confirmed, higher price
    {
      checkIn: new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000),
      nights: 3,
      nightPriceCents: Math.round(baseNightCents * 1.1),
      status: "CONFIRMED",
      withPayment: true,
    },
    // Upcoming – confirmed, lower price
    {
      checkIn: new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000),
      nights: 1,
      nightPriceCents: Math.round(baseNightCents * 0.85),
      status: "CONFIRMED",
    },
    // Later next month – awaiting approval
    {
      checkIn: new Date(now.getFullYear(), now.getMonth() + 1, 10),
      nights: 5,
      nightPriceCents: Math.round(baseNightCents * 0.9),
      status: "AWAITING_HOST_APPROVAL",
    },
  ];

  const { allocateUniqueConfirmationCode } = await import("@/lib/bnhub/confirmation-code");
  const { generateBookingCode } = await import("@/lib/codes/generate-code");

  for (const d of demos) {
    const totalCents = d.nightPriceCents * d.nights;
    const fees = feeCents(totalCents);
    const checkOut = new Date(d.checkIn.getTime() + d.nights * 24 * 60 * 60 * 1000);
    const confirmationCode = await allocateUniqueConfirmationCode();

    const b = await prisma.$transaction(async (tx) => {
      const bookingCode = await generateBookingCode(tx);
      return tx.booking.create({
        data: {
          listingId,
          guestId,
          checkIn: d.checkIn,
          checkOut,
          nights: d.nights,
          totalCents,
          guestFeeCents: fees.guestFeeCents,
          hostFeeCents: fees.hostFeeCents,
          status: d.status,
          confirmationCode,
          bookingCode,
        },
      });
    });

    if (d.withPayment) {
      await prisma.payment.create({
        data: {
          bookingId: b.id,
          amountCents: fees.guestTotalCents,
          guestFeeCents: fees.guestFeeCents,
          hostFeeCents: fees.hostFeeCents,
          hostPayoutCents: fees.hostPayoutCents,
          status: "COMPLETED",
        },
      });
    }
  }
}

/** If there are no bookings in the database, create demo bookings for the first host with a listing. */
export async function ensurePlatformDemoBookings(): Promise<string | null> {
  const totalBookings = await prisma.booking.count();
  if (totalBookings > 0) return null;

  const firstListing = await prisma.shortTermListing.findFirst({
    where: { listingStatus: "PUBLISHED" },
    select: { ownerId: true },
    orderBy: { createdAt: "asc" },
  });
  if (!firstListing) return null;

  await ensureDemoBookings(firstListing.ownerId);
  return firstListing.ownerId;
}
