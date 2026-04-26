import Link from "next/link";
import { redirect } from "next/navigation";
import { ListingStatus } from "@prisma/client";
import { getGuestId } from "@/lib/auth/session";
import { isPlatformAdmin } from "@/lib/auth/is-platform-admin";
import { getLegacyDB } from "@/lib/db/legacy";
const prisma = getLegacyDB();
import { getListingRevenueMetrics } from "@/modules/bnhub-revenue/bnhub-revenue-dashboard.service";
import { addUtcDays, startOfUtcDay } from "@/modules/bnhub-revenue/bnhub-revenue-math";
import { generateInvestorNarrative } from "@/modules/revenue/narrative/investor-narrative.service";

export const dynamic = "force-dynamic";

function formatMoney(currencyCode: string, value: number) {
  return new Intl.NumberFormat("en-CA", {
    style: "currency",
    currency: currencyCode.length === 3 ? currencyCode : "USD",
    maximumFractionDigits: 0,
  }).format(value || 0);
}

function percentRatio(r: number) {
  return `${Math.round(Math.min(1, Math.max(0, r)) * 100)}%`;
}

export default async function AdminInvestorBnhubRevenuePage() {
  const uid = await getGuestId();
  if (!uid || !(await isPlatformAdmin(uid))) redirect("/admin");

  const today = startOfUtcDay(new Date());
  const startRange = addUtcDays(today, -29);
  const range = { start: startRange, end: today };

  const [listings, investorNarrative] = await Promise.all([
    prisma.shortTermListing.findMany({
      where: { listingStatus: ListingStatus.PUBLISHED },
      select: { id: true },
      orderBy: { updatedAt: "desc" },
      take: 80,
    }),
    generateInvestorNarrative().catch(() => null),
  ]);

  const settled = await Promise.allSettled(
    listings.map((l) => getListingRevenueMetrics(l.id, range))
  );

  const rows: {
    listingId: string;
    metrics: NonNullable<Awaited<ReturnType<typeof getListingRevenueMetrics>>>;
  }[] = [];
  for (let idx = 0; idx < settled.length; idx++) {
    const r = settled[idx];
    const l = listings[idx];
    if (r.status === "fulfilled" && r.value) {
      rows.push({ listingId: l.id, metrics: r.value });
    }
  }

  const failures = settled.filter((r) => r.status === "rejected").length;

  return (
    <main className="pb-16">
      <section className="border-b border-amber-900/25 bg-zinc-950/50 px-4 py-8 sm:px-6">
        <div className="mx-auto max-w-6xl">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-500">BNHub portfolio</p>
          <h1 className="mt-2 font-serif text-2xl text-amber-100">Published stay performance</h1>
          <p className="mt-2 max-w-2xl text-sm text-zinc-500">
            Same deterministic KPI definitions as the host dashboard — aggregated from BNHub bookings only (UTC last 30
            days, check-in window).
          </p>
          <Link href="/admin/investor" className="mt-4 inline-block text-xs text-amber-400/90 hover:text-amber-300">
            ← Investor home
          </Link>
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        {failures > 0 ? (
          <p className="mb-4 text-xs text-amber-200/80">{failures} listing metric queries failed — rows below are partial.</p>
        ) : null}

        {investorNarrative ? (
          <section className="mb-10 space-y-4 rounded-xl border border-amber-900/30 bg-zinc-950/60 p-5">
            <div>
              <h2 className="text-lg font-semibold text-amber-100">AI Revenue Summary (investor)</h2>
              <p className="mt-1 text-xs text-zinc-500">
                Deterministic macro narrative from published listings (two 30-day UTC windows vs prior 30 days). Not
                predictive AI; not financial advice.
              </p>
            </div>
            <div className="space-y-2 rounded-lg border border-zinc-800 bg-black/30 p-4">
              <p className="text-lg font-semibold text-white">{investorNarrative.headline}</p>
              <p className="text-sm leading-relaxed text-zinc-400">{investorNarrative.overview}</p>
              <p className="text-sm leading-relaxed text-zinc-500">{investorNarrative.closing}</p>
            </div>
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
              <div className="rounded-lg border border-zinc-800 p-4">
                <h3 className="mb-2 font-medium text-amber-100/90">Facts</h3>
                <ul className="space-y-2 text-sm text-zinc-400">
                  {investorNarrative.facts.map((f) => (
                    <li key={`${f.label}-${f.value}`}>
                      <span className="text-zinc-200">{f.label}:</span> {f.value}
                      <div className="text-xs text-zinc-600">{f.explanation}</div>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="rounded-lg border border-zinc-800 p-4">
                <h3 className="mb-2 font-medium text-amber-100/90">Risks</h3>
                {investorNarrative.risks.length ? (
                  <ul className="space-y-2 text-sm text-zinc-400">
                    {investorNarrative.risks.map((r, i) => (
                      <li key={i}>
                        <span className="uppercase text-zinc-500">{r.severity}</span> — {r.message}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-zinc-600">No rule-based risks on these inputs.</p>
                )}
              </div>
              <div className="rounded-lg border border-zinc-800 p-4">
                <h3 className="mb-2 font-medium text-amber-100/90">Opportunities</h3>
                {investorNarrative.opportunities.length ? (
                  <ul className="space-y-2 text-sm text-zinc-400">
                    {investorNarrative.opportunities.map((o, i) => (
                      <li key={i}>
                        <span className="uppercase text-zinc-500">{o.priority}</span> — {o.message}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-zinc-600">No rule-based opportunities on these inputs.</p>
                )}
              </div>
            </div>
          </section>
        ) : (
          <p className="mb-6 text-sm text-zinc-500">Investor narrative unavailable for this load.</p>
        )}

        <div className="overflow-x-auto rounded-xl border border-zinc-800 bg-[#111]">
          <table className="w-full min-w-[720px] text-sm">
            <thead className="border-b border-zinc-800 bg-black/40 text-left text-xs uppercase text-zinc-500">
              <tr>
                <th className="px-4 py-3">Listing</th>
                <th className="px-4 py-3">Revenue</th>
                <th className="px-4 py-3">Bookings</th>
                <th className="px-4 py-3">Occupancy</th>
                <th className="px-4 py-3">ADR</th>
                <th className="px-4 py-3">RevPAR</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-zinc-500">
                    No published BNHub listings or metrics unavailable.
                  </td>
                </tr>
              ) : (
                rows.map(({ metrics }) => (
                  <tr key={metrics.listingId} className="border-b border-zinc-800/80">
                    <td className="px-4 py-3 font-medium text-white">{metrics.listingTitle}</td>
                    <td className="px-4 py-3 text-zinc-300">{formatMoney(metrics.currency, metrics.grossRevenue)}</td>
                    <td className="px-4 py-3 text-zinc-400">{metrics.bookingCount}</td>
                    <td className="px-4 py-3 text-zinc-400">{percentRatio(metrics.occupancyRate)}</td>
                    <td className="px-4 py-3 text-zinc-400">{formatMoney(metrics.currency, metrics.adr)}</td>
                    <td className="px-4 py-3 text-zinc-400">{formatMoney(metrics.currency, metrics.revpar)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}
