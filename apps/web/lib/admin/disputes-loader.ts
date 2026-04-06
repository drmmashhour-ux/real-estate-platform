import { prisma } from "@/lib/db";

export type AdminDisputeRow = {
  id: string;
  bookingId: string;
  status: string;
  amountCents: number | null;
  createdAt: Date;
  guestLabel: string;
  hostLabel: string;
  listingTitle: string;
  reason: string;
};

export async function getAdminDisputesList(take = 120): Promise<AdminDisputeRow[]> {
  const rows = await prisma.dispute.findMany({
    orderBy: { createdAt: "desc" },
    take,
    include: {
      booking: {
        select: {
          id: true,
          guest: { select: { name: true, email: true } },
          listing: { select: { title: true, owner: { select: { name: true, email: true } } } },
        },
      },
    },
  });

  return rows.map((d) => ({
    id: d.id,
    bookingId: d.bookingId,
    status: d.status,
    amountCents: d.refundCents ?? null,
    createdAt: d.createdAt,
    guestLabel: d.booking.guest?.name ?? d.booking.guest?.email ?? "Guest",
    hostLabel: d.booking.listing.owner?.name ?? d.booking.listing.owner?.email ?? "Host",
    listingTitle: d.booking.listing.title,
    reason: d.description.slice(0, 200),
  }));
}
