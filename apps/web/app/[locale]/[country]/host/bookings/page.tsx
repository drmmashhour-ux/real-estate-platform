import Link from "next/link";
import { getGuestId } from "@/lib/auth/session";
import { HostBookingsManagerClient } from "@/components/host/HostBookingsManagerClient";
import { getHostBookings } from "@/lib/host/bookings-data";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

const GOLD = "#D4AF37";

export default async function HostBookingsPage() {
  const hostId = await getGuestId();
  if (!hostId) return null;

  const [bookings, listings] = await Promise.all([
    getHostBookings(hostId, { tab: "all" }),
    prisma.shortTermListing.findMany({
      where: { ownerId: hostId },
      orderBy: { title: "asc" },
      select: { id: true, title: true },
    }),
  ]);

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Bookings</h1>
          <p className="mt-1 text-sm text-zinc-500">Manage reservations across your listings.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <a
            href="/api/host/bookings/export"
            className="rounded-xl border border-zinc-700 bg-[#111] px-4 py-2.5 text-sm font-medium text-zinc-200 hover:bg-zinc-900"
          >
            Export CSV
          </a>
          <Link
            href="/host/calendar"
            className="rounded-xl px-4 py-2.5 text-sm font-semibold text-black"
            style={{ backgroundColor: GOLD }}
          >
            Calendar
          </Link>
        </div>
      </div>

      <HostBookingsManagerClient bookings={bookings} listings={listings} />
    </div>
  );
}
