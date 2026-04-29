import { BookingStatus } from "@/types/booking-status-client";
import { ListingAnalyticsKind } from "@/types/listing-analytics-kind-client";
import { prisma } from "@/lib/db";

const WINDOW_DAYS = 30;

export async function GrowthSystemMetricsPanel() {
  const since = new Date(Date.now() - WINDOW_DAYS * 864e5);
  const [
    totalUsers,
    searchEvents,
    listingViews,
    bookingStarts,
    bookingCompleted,
    bookingsPerDay,
    topStayViews,
    platformFees,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.growthEvent.count({ where: { eventName: "search", createdAt: { gte: since } } }),
    prisma.growthEvent.count({ where: { eventName: "listing_view", createdAt: { gte: since } } }),
    prisma.growthEvent.count({ where: { eventName: "booking_started", createdAt: { gte: since } } }),
    prisma.growthEvent.count({ where: { eventName: "booking_completed", createdAt: { gte: since } } }),
    prisma.$queryRaw<Array<{ day: Date; c: bigint }>>`
      SELECT date_trunc('day', "created_at") AS day, COUNT(*)::bigint AS c
      FROM "Booking"
      WHERE "created_at" >= ${since}
      GROUP BY 1
      ORDER BY 1 DESC
      LIMIT 14
    `,
    prisma.listingAnalytics.findMany({
      where: { kind: { in: [ListingAnalyticsKind.FSBO, ListingAnalyticsKind.BNHUB] } },
      orderBy: { views24hCached: "desc" },
      take: 8,
      select: { listingId: true, kind: true, views24hCached: true, demandScore: true },
    }),
    prisma.platformPayment
      .aggregate({
        where: {
          createdAt: { gte: since },
          platformFeeCents: { not: null },
          status: "paid",
        },
        _sum: { platformFeeCents: true },
      })
      .catch(() => ({ _sum: { platformFeeCents: null as number | null } })),
  ]);

  const searches = searchEvents;
  const sToL = searches > 0 ? ((listingViews / searches) * 100).toFixed(1) : "—";
  const lToB = listingViews > 0 ? ((bookingStarts / listingViews) * 100).toFixed(2) : "—";
  const bToPay = bookingStarts > 0 ? ((bookingCompleted / bookingStarts) * 100).toFixed(1) : "—";

  const completedBookings = await prisma.booking.count({
    where: { status: BookingStatus.COMPLETED, updatedAt: { gte: since } },
  });

  return (
    <section className="mt-10 rounded-2xl border border-slate-800 bg-slate-900/50 p-6">
      <h2 className="text-lg font-semibold text-white">Growth system (v1) — last {WINDOW_DAYS} days</h2>
      <p className="mt-1 text-sm text-slate-400">
        Source: <code className="text-slate-500">growth_events</code>, <code className="text-slate-500">Booking</code>,{" "}
        <code className="text-slate-500">listing_analytics</code>. No secrets logged.
      </p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Metric label="Total users (all time)" value={totalUsers} />
        <Metric label="Searches (growth_events)" value={searches} />
        <Metric label="Listing views" value={listingViews} />
        <Metric label="Bookings started" value={bookingStarts} />
        <Metric label="Payments completed (growth)" value={bookingCompleted} />
        <Metric label="Stays completed (status)" value={completedBookings} />
      </div>

      <div className="mt-6 rounded-xl border border-slate-800 bg-slate-950/60 p-4">
        <h3 className="text-sm font-semibold text-slate-200">Conversion (approximate)</h3>
        <ul className="mt-2 space-y-1 text-sm text-slate-400">
          <li>Search → listing view: {sToL}%</li>
          <li>Listing view → booking started: {lToB}%</li>
          <li>Booking started → payment success (growth beacon): {bToPay}%</li>
        </ul>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <div>
          <h3 className="text-sm font-semibold text-slate-200">Bookings per day (new rows)</h3>
          <ul className="mt-2 max-h-40 overflow-auto text-xs text-slate-500">
            {bookingsPerDay.length === 0 ? (
              <li>No bookings in window.</li>
            ) : (
              bookingsPerDay.map((row) => (
                <li key={String(row.day)} className="flex justify-between gap-4 border-b border-slate-800/80 py-1">
                  <span>{new Date(row.day).toISOString().slice(0, 10)}</span>
                  <span className="text-slate-300">{String(row.c)}</span>
                </li>
              ))
            )}
          </ul>
        </div>
        <div>
          <h3 className="text-sm font-semibold text-slate-200">Listings — top 24h views (cached)</h3>
          <ul className="mt-2 space-y-1 text-xs text-slate-400">
            {topStayViews.map((r) => (
              <li key={`${r.kind}-${r.listingId}`} className="flex justify-between gap-2">
                <span className="truncate text-slate-500">
                  <span className="text-slate-600">{r.kind}</span> ·{" "}
                  <code className="text-slate-500">{r.listingId}</code>
                </span>
                <span>
                  {r.views24hCached} views · {r.demandScore}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <p className="mt-4 text-xs text-slate-500">
        Platform fees (paid rows, window):{" "}
        <span className="text-slate-300">
          {platformFees._sum.platformFeeCents != null
            ? `$${(platformFees._sum.platformFeeCents / 100).toLocaleString("en-CA", { maximumFractionDigits: 0 })} CAD`
            : "—"}
        </span>{" "}
        (from <code className="text-slate-600">platform_payments.platform_fee_cents</code>).
      </p>
    </section>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-950/60 px-4 py-3">
      <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-white">{value.toLocaleString()}</p>
    </div>
  );
}
