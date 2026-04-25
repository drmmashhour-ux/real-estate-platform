import Link from "next/link";
import { Calendar, Home, LineChart, MessageCircle, Pencil, ShieldBan } from "lucide-react";
import type { HostDashboardStats } from "@/lib/host/dashboard-data";

const GOLD = "#D4AF37";

type Props = {
  stats: HostDashboardStats;
  /** First listing to deep-link “edit” when present */
  primaryListingId: string | null;
  earningsCad: string;
};

/**
 * Host dashboard: headline KPIs, occupancy, and quick actions (edit, block dates, messages).
 */
export function HostHomeOverview({ stats, primaryListingId, earningsCad }: Props) {
  const editHref = primaryListingId ? `/bnhub/host/listings/${primaryListingId}/edit` : "/host/listings";
  const calendarHref = primaryListingId ? `/host/calendar?listing=${encodeURIComponent(primaryListingId)}` : "/host/calendar";

  return (
    <div className="space-y-8">
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl border border-zinc-800 bg-[#111] p-5">
          <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">Total earnings (MTD)</p>
          <p className="mt-2 text-2xl font-bold" style={{ color: GOLD }}>
            {earningsCad}
          </p>
          <p className="mt-1 text-xs text-zinc-500">Completed guest payments this calendar month (see Earnings for detail).</p>
        </div>
        <div className="rounded-2xl border border-zinc-800 bg-[#111] p-5">
          <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">Upcoming bookings</p>
          <p className="mt-2 text-3xl font-bold text-white">{stats.upcomingBookings}</p>
          <p className="mt-1 text-xs text-zinc-500">Future stays (non-canceled) across your portfolio.</p>
        </div>
        <div className="rounded-2xl border border-zinc-800 bg-[#111] p-5">
          <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">Occupancy (30d est.)</p>
          <p className="mt-2 text-3xl font-bold text-white">{stats.occupancyRatePercent}%</p>
          <p className="mt-1 text-xs text-zinc-500">Rough share of available nights with stays on the books.</p>
        </div>
        <div className="rounded-2xl border border-zinc-800 bg-[#111] p-5">
          <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">Listings</p>
          <p className="mt-2 text-3xl font-bold text-white">{stats.publishedListings}</p>
          <p className="mt-1 text-xs text-zinc-500">Published of {stats.totalListings} total</p>
        </div>
      </section>

      <section className="rounded-2xl border border-zinc-800 bg-[#0c0c0c] p-4 sm:p-6">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">Quick actions</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <Link
            href={editHref}
            className="flex min-h-[56px] items-center gap-3 rounded-xl border border-zinc-800 bg-[#111] px-4 py-3 text-sm font-medium text-white transition hover:border-amber-600/30"
          >
            <Pencil className="h-5 w-5 shrink-0" style={{ color: GOLD }} />
            <span>
              <span className="block">Edit listing</span>
              <span className="text-xs font-normal text-zinc-500">Photos, copy, and rules</span>
            </span>
          </Link>
          <Link
            href={calendarHref}
            className="flex min-h-[56px] items-center gap-3 rounded-xl border border-zinc-800 bg-[#111] px-4 py-3 text-sm font-medium text-white transition hover:border-amber-600/30"
          >
            <ShieldBan className="h-5 w-5 shrink-0" style={{ color: GOLD }} />
            <span>
              <span className="block">Block dates</span>
              <span className="text-xs font-normal text-zinc-500">Calendar: pick a listing, tap a day</span>
            </span>
          </Link>
          <Link
            href="/messages"
            className="flex min-h-[56px] items-center gap-3 rounded-xl border border-zinc-800 bg-[#111] px-4 py-3 text-sm font-medium text-white transition hover:border-amber-600/30"
          >
            <MessageCircle className="h-5 w-5 shrink-0" style={{ color: GOLD }} />
            <span>
              <span className="block">View messages</span>
              <span className="text-xs font-normal text-zinc-500">Guest conversations + quick replies</span>
            </span>
          </Link>
          <Link
            href="/host/bookings"
            className="flex min-h-[56px] items-center gap-3 rounded-xl border border-zinc-800 bg-[#111] px-4 py-3 text-sm font-medium text-white transition hover:border-amber-600/30"
          >
            <Calendar className="h-5 w-5 shrink-0 text-zinc-400" />
            <span>
              <span className="block">All bookings</span>
              <span className="text-xs font-normal text-zinc-500">Upcoming & past</span>
            </span>
          </Link>
          <Link
            href="/host/earnings"
            className="flex min-h-[56px] items-center gap-3 rounded-xl border border-zinc-800 bg-[#111] px-4 py-3 text-sm font-medium text-white transition hover:border-amber-600/30"
          >
            <LineChart className="h-5 w-5 shrink-0 text-zinc-400" />
            <span>
              <span className="block">Earnings</span>
              <span className="text-xs font-normal text-zinc-500">Revenue & payouts</span>
            </span>
          </Link>
          <Link
            href="/host/listings"
            className="flex min-h-[56px] items-center gap-3 rounded-xl border border-zinc-800 bg-[#111] px-4 py-3 text-sm font-medium text-white transition hover:border-amber-600/30"
          >
            <Home className="h-5 w-5 shrink-0 text-zinc-400" />
            <span>
              <span className="block">Manage listings</span>
              <span className="text-xs font-normal text-zinc-500">Pause, price, go live</span>
            </span>
          </Link>
        </div>
      </section>
    </div>
  );
}
