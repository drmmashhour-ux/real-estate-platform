import Link from "next/link";
import { ListingStatus } from "@prisma/client";
import { LecipmControlShell } from "@/components/admin/LecipmControlShell";
import { getAdminRiskAlerts } from "@/lib/admin/control-center";
import { requireAdminControlUserId } from "@/lib/admin/guard";
import { prisma } from "@/lib/db";
import { countBnhubViewedNotBookedPairs } from "@/lib/bnhub/bnhub-retargeting-queries";

export const dynamic = "force-dynamic";

export default async function AdminBnhubBookingGrowthPage() {
  await requireAdminControlUserId();
  const riskAlerts = await getAdminRiskAlerts();
  const alerts = riskAlerts.map((r) => ({
    id: r.id,
    title: r.title,
    detail: r.detail,
    href: r.href,
    severity: r.severity,
  }));

  const since30 = new Date();
  since30.setDate(since30.getDate() - 30);

  const [topByBookings, retargetPairs, contentPieces] = await Promise.all([
    prisma.listingSearchMetrics.findMany({
      where: { listing: { listingStatus: ListingStatus.PUBLISHED } },
      orderBy: [{ bookings30d: "desc" }, { views30d: "desc" }],
      take: 15,
      select: {
        listingId: true,
        views30d: true,
        bookings30d: true,
        conversionRate: true,
        listing: { select: { title: true, city: true, listingCode: true } },
      },
    }),
    countBnhubViewedNotBookedPairs(since30).catch(() => 0),
    prisma.machineGeneratedContent.count().catch(() => 0),
  ]);

  return (
    <LecipmControlShell alerts={alerts}>
      <div className="space-y-8 text-white">
        <div>
          <Link href="/admin/bnhub" className="text-sm text-amber-400">
            ← BNHUB
          </Link>
          <h1 className="mt-2 text-2xl font-bold">Booking growth &amp; winners</h1>
          <p className="mt-2 max-w-2xl text-sm text-zinc-400">
            Surfaces high-performing stays from <code className="text-zinc-500">listing_search_metrics</code>, BNHUB
            retargeting volume, and links into content tooling. Pair with{" "}
            <Link href="/admin/funnel" className="text-emerald-400 hover:text-emerald-300">
              /admin/funnel
            </Link>{" "}
            for cross-product funnel events.
          </p>
        </div>

        <section className="rounded-2xl border border-zinc-800 bg-[#111] p-5">
          <h2 className="text-sm font-semibold text-zinc-200">Retargeting (30d)</h2>
          <p className="mt-1 text-xs text-zinc-500">
            Distinct user×listing pairs: viewed a stay on BNHUB (
            <code className="text-zinc-400">search_events</code>) with no in-window active booking — export to ads
            platforms from your warehouse or CDP.
          </p>
          <p className="mt-3 text-3xl font-semibold tabular-nums text-emerald-300">{retargetPairs.toLocaleString()}</p>
          <p className="mt-1 text-xs text-zinc-500">Pairs (not deduped users).</p>
        </section>

        <section className="rounded-2xl border border-zinc-800 bg-[#111] p-5">
          <div className="flex flex-wrap items-end justify-between gap-2">
            <h2 className="text-sm font-semibold text-zinc-200">Top listings (30d signals)</h2>
            <Link href="/admin/content-intelligence" className="text-xs text-amber-400 hover:text-amber-300">
              Content intelligence →
            </Link>
          </div>
          <p className="mt-1 text-xs text-zinc-500">
            Homepage &amp; “Recommended” search use performance boosts from these metrics + paid placements.
            Generated content variants: <span className="text-zinc-300">{contentPieces}</span> machine rows (all
            time).
          </p>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[520px] text-left text-sm">
              <thead className="border-b border-zinc-800 text-xs uppercase text-zinc-500">
                <tr>
                  <th className="py-2 pr-3">Listing</th>
                  <th className="py-2 pr-3">Views 30d</th>
                  <th className="py-2 pr-3">Bookings 30d</th>
                  <th className="py-2">Conv.</th>
                </tr>
              </thead>
              <tbody>
                {topByBookings.map((row) => (
                  <tr key={row.listingId} className="border-b border-zinc-800/80">
                    <td className="py-2 pr-3">
                      <span className="text-zinc-200">{row.listing.title}</span>
                      <span className="mt-0.5 block text-xs text-zinc-500">{row.listing.city}</span>
                      <Link
                        className="text-xs text-amber-400"
                        href={`/bnhub/stays/${encodeURIComponent(row.listing.listingCode ?? row.listingId)}`}
                      >
                        View
                      </Link>
                    </td>
                    <td className="py-2 pr-3 tabular-nums text-zinc-300">{row.views30d}</td>
                    <td className="py-2 pr-3 tabular-nums text-zinc-300">{row.bookings30d}</td>
                    <td className="py-2 tabular-nums text-zinc-400">
                      {row.conversionRate != null ? `${(row.conversionRate * 100).toFixed(2)}%` : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="rounded-2xl border border-zinc-800 bg-[#111] p-5 text-sm text-zinc-400">
          <h2 className="text-sm font-semibold text-zinc-200">Automation</h2>
          <ul className="mt-2 list-inside list-disc space-y-1">
            <li>
              Cron: <code className="text-zinc-500">POST /api/cron/bnhub-booking-reminders</code> (Bearer{" "}
              <code className="text-zinc-500">CRON_SECRET</code>) — nudges guests with stale{" "}
              <code className="text-zinc-500">PENDING</code> bookings.
            </li>
            <li>
              Marketing retargeting helpers: <code className="text-zinc-500">lib/marketing/retargeting-funnel.ts</code>
            </li>
          </ul>
        </section>
      </div>
    </LecipmControlShell>
  );
}
