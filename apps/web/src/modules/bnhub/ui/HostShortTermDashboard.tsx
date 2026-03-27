import { prisma } from "@/lib/db";

export async function HostShortTermDashboard({ hostId }: { hostId: string }) {
  const [listings, bookings] = await Promise.all([
    prisma.shortTermListing.findMany({
      where: { ownerId: hostId },
      orderBy: { createdAt: "desc" },
      select: { id: true, title: true, listingStatus: true, verificationStatus: true, nightPriceCents: true },
      take: 20,
    }),
    prisma.booking.findMany({
      where: { listing: { ownerId: hostId } },
      orderBy: { createdAt: "desc" },
      select: { id: true, status: true, totalCents: true, createdAt: true },
      take: 20,
    }),
  ]);

  const earningsCents = bookings
    .filter((b) => b.status === "COMPLETED")
    .reduce((sum, b) => sum + b.totalCents, 0);

  return (
    <section className="space-y-4">
      <div className="rounded-xl border border-white/10 bg-black/20 p-4 text-sm text-slate-300">
        <h3 className="font-semibold text-white">Host dashboard</h3>
        <p className="mt-1">Listings: {listings.length}</p>
        <p>Recent bookings: {bookings.length}</p>
        <p>Earnings (completed): ${(earningsCents / 100).toFixed(2)}</p>
      </div>
      <div className="rounded-xl border border-white/10 bg-black/20 p-4 text-xs text-slate-300">
        <h4 className="font-semibold text-white">Manage listings</h4>
        <ul className="mt-2 space-y-1">
          {listings.map((l) => (
            <li key={l.id}>
              {l.title} — {l.listingStatus} / {l.verificationStatus} — ${(l.nightPriceCents / 100).toFixed(0)}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

