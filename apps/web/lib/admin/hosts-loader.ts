import { BookingStatus, PaymentStatus } from "@prisma/client";
import { prisma } from "@/lib/db";

export type AdminHostRow = {
  userId: string;
  bnhubHostId: string | null;
  name: string;
  email: string;
  hostStatus: string | null;
  listingsCount: number;
  confirmedBookings: number;
  totalEarningsCents: number;
  payoutStatusLabel: string;
  avgRating: number | null;
};

export async function getAdminHosts(take = 80): Promise<AdminHostRow[]> {
  const owners = await prisma.user.findMany({
    where: { shortTermListings: { some: {} } },
    orderBy: { updatedAt: "desc" },
    take,
    select: {
      id: true,
      name: true,
      email: true,
      bnhubHosts: { take: 1, select: { id: true, status: true } },
      shortTermListings: {
        select: {
          id: true,
          bnhubListingRatingAverage: true,
        },
      },
    },
  });

  const rows = await Promise.all(
    owners.map(async (o) => {
      const listingIds = o.shortTermListings.map((l) => l.id);
      const bh = o.bnhubHosts[0];

      const [confirmedBookings, payAgg, payoutMix] = await Promise.all([
        listingIds.length
          ? prisma.booking.count({
              where: {
                listingId: { in: listingIds },
                status: { in: [BookingStatus.CONFIRMED, BookingStatus.COMPLETED] },
              },
            })
          : 0,
        listingIds.length
          ? prisma.payment.aggregate({
              where: {
                status: PaymentStatus.COMPLETED,
                booking: { listingId: { in: listingIds } },
              },
              _sum: { hostPayoutCents: true },
            })
          : { _sum: { hostPayoutCents: null as number | null } },
        prisma.bnhubHostPayoutRecord.groupBy({
          by: ["payoutStatus"],
          where: { hostUserId: o.id },
          _count: { _all: true },
        }),
      ]);

      const ratings = o.shortTermListings
        .map((l) => l.bnhubListingRatingAverage)
        .filter((x): x is number => x != null);
      const avgRating = ratings.length ? ratings.reduce((a, b) => a + b, 0) / ratings.length : null;

      const payoutStatusLabel =
        payoutMix.length === 0
          ? "—"
          : payoutMix.map((p) => `${p.payoutStatus}:${p._count._all}`).join(" · ");

      return {
        userId: o.id,
        bnhubHostId: bh?.id ?? null,
        name: o.name ?? o.email.split("@")[0] ?? "Host",
        email: o.email,
        hostStatus: bh?.status ?? null,
        listingsCount: o.shortTermListings.length,
        confirmedBookings,
        totalEarningsCents: payAgg._sum.hostPayoutCents ?? 0,
        payoutStatusLabel,
        avgRating,
      };
    })
  );

  return rows;
}
