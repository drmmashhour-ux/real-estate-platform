import Link from "next/link";
import { HostAiCopilotSection } from "@/components/host/HostAiCopilotSection";
import { HostAiSuggestionsSection } from "@/components/host/HostAiSuggestionsSection";
import { HostHomeOverview } from "@/components/host/HostHomeOverview";
import { PricingInsightCard } from "@/components/host/PricingInsightCard";
import { getGuestId } from "@/lib/auth/session";
import { revenueV4Flags } from "@/config/feature-flags";
import { loadHostAiPanel } from "@/modules/host-ai/panel.service";
import {
  getHostAiSuggestions,
  getHostDashboardStats,
  getHostListingPerformanceTop,
  getHostRecentActivity,
  getHostUpcomingBookings,
} from "@/lib/host";

const GOLD = "#D4AF37";

function Trend({ dir }: { dir: "up" | "down" | "flat" }) {
  if (dir === "flat") return <span className="text-zinc-600">—</span>;
  return (
    <span className={dir === "up" ? "text-emerald-400" : "text-rose-400"}>
      {dir === "up" ? "↑" : "↓"}
    </span>
  );
}

export default async function HostDashboardPage() {
  const hostId = await getGuestId();
  if (!hostId) return null;

  const [stats, upcoming, activity, performance, suggestions, hostAiPanel] = await Promise.all([
    getHostDashboardStats(hostId),
    getHostUpcomingBookings(hostId, 5),
    getHostRecentActivity(hostId, 8),
    getHostListingPerformanceTop(hostId, 3),
    getHostAiSuggestions(hostId),
    loadHostAiPanel(hostId),
  ]);

  const earningsCad = (stats.monthlyRevenueCents / 100).toLocaleString("en-CA", {
    style: "currency",
    currency: "CAD",
  });

  const primaryListingId = performance[0]?.listingId ?? null;

  return (
    <div className="space-y-10">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Host dashboard</h1>
          <p className="mt-1 text-sm text-zinc-500">Your BNHUB business at a glance.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/host/listings/new"
            className="rounded-xl px-4 py-2.5 text-sm font-semibold text-black shadow-sm"
            style={{ backgroundColor: GOLD }}
          >
            Add listing
          </Link>
          <Link
            href="/host/pricing"
            className="rounded-xl border border-zinc-700 bg-[#111] px-4 py-2.5 text-sm font-medium text-zinc-200 hover:bg-zinc-900"
          >
            Smart pricing
          </Link>
          <Link
            href="/host/autopilot"
            className="rounded-xl border border-zinc-700 bg-[#111] px-4 py-2.5 text-sm font-medium text-zinc-200 hover:bg-zinc-900"
          >
            Autopilot
          </Link>
          <Link
            href="/host/calendar"
            className="rounded-xl border border-zinc-700 bg-[#111] px-4 py-2.5 text-sm font-medium text-zinc-200 hover:bg-zinc-900"
          >
            View calendar
          </Link>
          <a
            href="/api/host/bookings/export"
            className="rounded-xl border border-zinc-700 bg-[#111] px-4 py-2.5 text-sm font-medium text-zinc-200 hover:bg-zinc-900"
          >
            Export bookings
          </a>
        </div>
      </div>

      <HostHomeOverview stats={stats} primaryListingId={primaryListingId} earningsCad={earningsCad} />

      <p className="text-xs text-zinc-600">
        Trends: earnings <Trend dir={stats.earningsTrend} />, listings <Trend dir={stats.listingsTrend} />. Avg nightly
        ${(stats.averageNightlyRateCents / 100).toFixed(0)} · {stats.confirmedBookings} confirmed stays lifetime
      </p>

      {revenueV4Flags.pricingEngineV2 && performance[0] ? (
        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-white">Pricing insight</h2>
          <PricingInsightCard listingId={performance[0].listingId} />
        </section>
      ) : null}

      <div className="grid gap-8 lg:grid-cols-3">
        <section className="lg:col-span-2 space-y-4">
          <h2 className="text-lg font-semibold text-white">Upcoming bookings</h2>
          {upcoming.length === 0 ? (
            <div className="rounded-2xl border border-zinc-800 bg-[#111] p-8 text-center text-sm text-zinc-500">
              No bookings yet — share your listing link to attract guests.
            </div>
          ) : (
            <div className="overflow-hidden rounded-2xl border border-zinc-800 bg-[#111]">
              <table className="min-w-full text-left text-sm">
                <thead className="border-b border-zinc-800 bg-black/40 text-xs uppercase text-zinc-500">
                  <tr>
                    <th className="px-4 py-3">Guest</th>
                    <th className="px-4 py-3">Property</th>
                    <th className="px-4 py-3">Stay</th>
                    <th className="px-4 py-3">Total</th>
                    <th className="px-4 py-3">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {upcoming.map((b) => (
                    <tr key={b.id} className="border-b border-zinc-800/80 last:border-0">
                      <td className="px-4 py-3 text-zinc-300">{b.guestName}</td>
                      <td className="px-4 py-3 text-zinc-400">{b.propertyTitle.slice(0, 28)}</td>
                      <td className="px-4 py-3 text-zinc-400">
                        {b.checkIn.toISOString().slice(0, 10)} → {b.checkOut.toISOString().slice(0, 10)}
                      </td>
                      <td className="px-4 py-3 font-medium" style={{ color: GOLD }}>
                        {b.totalCents != null
                          ? (b.totalCents / 100).toLocaleString("en-CA", {
                              style: "currency",
                              currency: "CAD",
                            })
                          : "—"}
                      </td>
                      <td className="px-4 py-3 text-xs text-zinc-500">
                        {b.status}
                        <br />
                        {b.paymentStatus ?? "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-white">Recent activity</h2>
          <ul className="space-y-2 rounded-2xl border border-zinc-800 bg-[#111] p-4">
            {activity.length === 0 ? (
              <li className="text-sm text-zinc-500">No recent events.</li>
            ) : (
              activity.map((a) => (
                <li key={a.id} className="border-b border-zinc-800/80 pb-2 last:border-0 last:pb-0">
                  <p className="text-sm font-medium text-zinc-200">{a.label}</p>
                  <p className="text-xs text-zinc-500">{a.detail}</p>
                  <p className="text-[10px] text-zinc-600">{a.createdAt.toISOString().slice(0, 16)}</p>
                </li>
              ))
            )}
          </ul>
        </section>
      </div>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-white">Listing performance</h2>
        {performance.length === 0 ? (
          <p className="text-sm text-zinc-500">Publish a listing to see performance metrics.</p>
        ) : (
          <div className="grid gap-4 md:grid-cols-3">
            {performance.map((p) => (
              <div key={p.listingId} className="rounded-2xl border border-zinc-800 bg-[#111] p-4">
                <p className="font-medium text-white">{p.title.slice(0, 36)}</p>
                <p className="text-xs text-zinc-500">{p.city}</p>
                <dl className="mt-3 space-y-1 text-sm">
                  <div className="flex justify-between text-zinc-400">
                    <dt>Views</dt>
                    <dd className="text-white">{p.views}</dd>
                  </div>
                  <div className="flex justify-between text-zinc-400">
                    <dt>Bookings</dt>
                    <dd className="text-white">{p.bookings}</dd>
                  </div>
                  <div className="flex justify-between text-zinc-400">
                    <dt>Conversion</dt>
                    <dd className="text-white">{p.conversionPercent}%</dd>
                  </div>
                  <div className="flex justify-between text-zinc-400">
                    <dt>Avg nightly</dt>
                    <dd style={{ color: GOLD }}>${(p.nightPriceCents / 100).toFixed(0)}</dd>
                  </div>
                </dl>
              </div>
            ))}
          </div>
        )}
      </section>

      <HostAiCopilotSection panel={hostAiPanel} />

      <section className="space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <h2 className="text-lg font-semibold text-white">More AI actions</h2>
          <Link href="/host/pricing" className="text-xs font-medium hover:underline" style={{ color: GOLD }}>
            Pricing overview →
          </Link>
        </div>
        <HostAiSuggestionsSection suggestions={suggestions} />
      </section>
    </div>
  );
}
