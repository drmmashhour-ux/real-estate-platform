import { prisma } from "@/lib/db";
import { subDays } from "date-fns";

export type RetentionPulse = {
  generatedAt: string;
  windowDays: number;
  /** Guest accounts with 2+ bookings (any time) — inventory of repeat behavior. */
  guestsWithTwoPlusBookings: number;
  /** Host accounts with 2+ listings (any time). */
  hostsWithTwoPlusListings: number;
  activeUsersRolling: number;
  disclaimers: string[];
};

/**
 * Repeat-behavior inventory + rolling active users — DB-derived only.
 */
export async function buildRetentionPulse(windowDays = 90): Promise<RetentionPulse> {
  const since = subDays(new Date(), windowDays);

  const [guestBookingGroups, hostListingGroups, activeUsersRolling] = await Promise.all([
    prisma.booking.groupBy({
      by: ["guestId"],
      _count: { _all: true },
    }),
    prisma.shortTermListing.groupBy({
      by: ["ownerId"],
      _count: { _all: true },
    }),
    prisma.user.count({
      where: { updatedAt: { gte: since }, accountStatus: "ACTIVE" },
    }),
  ]);

  const guestsWithTwoPlusBookings = guestBookingGroups.filter((g) => g._count._all > 1).length;
  const hostsWithTwoPlusListings = hostListingGroups.filter((g) => g._count._all > 1).length;

  return {
    generatedAt: new Date().toISOString(),
    windowDays,
    guestsWithTwoPlusBookings,
    hostsWithTwoPlusListings,
    activeUsersRolling,
    disclaimers: [
      "Repeat counts are lifetime groupBy tallies, not cohort retention curves.",
      "`activeUsersRolling` uses `updatedAt` in window — aligns with internal investor snapshot definition.",
    ],
  };
}
