import Link from "next/link";
import type { HostBookingListRow } from "@/lib/host/bookings-data";
import { HostBookingsManagerClient } from "./HostBookingsManagerClient";

const GOLD = "#D4AF37";

/**
 * Host bookings: upcoming, past, canceled; filters; links to detail and messages.
 */
export function HostBookingsPage({
  bookings,
  listings,
}: {
  bookings: HostBookingListRow[];
  listings: { id: string; title: string }[];
}) {
  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Bookings</h1>
          <p className="mt-1 text-sm text-zinc-500">Upcoming, past, and canceled stays with status and payment.</p>
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

      <div className="rounded-2xl border border-zinc-800 bg-[#0c0c0c] p-4 sm:p-5">
        <p className="text-sm font-medium text-white">Guest messages</p>
        <p className="mt-1 text-sm text-zinc-500">
          Reply from your inbox. Conversations are linked from each booking when the guest has a thread.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <Link
            href="/messages"
            className="inline-flex min-h-[40px] items-center rounded-xl px-4 py-2 text-sm font-semibold text-black"
            style={{ backgroundColor: GOLD }}
          >
            Open messages
          </Link>
          <span className="self-center text-xs text-zinc-600">Pro tip: respond quickly to improve conversion.</span>
        </div>
      </div>

      <HostBookingsManagerClient bookings={bookings} listings={listings} />
    </div>
  );
}
