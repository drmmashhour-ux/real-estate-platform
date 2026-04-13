"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";

type ScalePayload = {
  rangeDays: number;
  lecipm: {
    range: { start: string; end: string };
    totals: {
      visits: number;
      signups: number;
      revenueCents: number;
      adSpendCents: number;
    };
    conversion: Record<string, number>;
    costs: { costPerSignupCents: number | null; costPerLeadCents: number | null };
    channels: { source: string; count: number }[];
  };
  bnhub: {
    users: { hosts: number; guestUsers: number; signupsInPeriod: number };
    listings: { published: number; draft: number };
    bookings: {
      confirmedOrCompletedInPeriod: number;
      gmvCentsInPeriod: number;
      avgBookingValueCents: number | null;
    };
    supplyByCity: { city: string; publishedListings: number }[];
  };
  marketplaceBalance: {
    underSuppliedCities: { city: string; country: string; publishedListings: number }[];
    topSupplyCities: { city: string; country: string; publishedListings: number }[];
    minListingsPerCity: number;
  };
  domination?: {
    cityPerformance: {
      key: string;
      displayName: string;
      publishedListings: number;
      bookingsInPeriod: number;
      gmvCentsInPeriod: number;
    }[];
    networkEffects: {
      publishedListings: number;
      bookingsLast30d: number;
      bookingsPerThousandListings: number | null;
    };
    revenuePerGuestUserCents: number | null;
  };
};

function money(cents: number) {
  return (cents / 100).toLocaleString(undefined, { style: "currency", currency: "USD", maximumFractionDigits: 0 });
}

export function GrowthDashboardClient() {
  const [days, setDays] = useState(30);
  const [data, setData] = useState<ScalePayload | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    setErr(null);
    try {
      const res = await fetch(`/api/admin/growth/scale-metrics?days=${days}`, { credentials: "same-origin" });
      if (!res.ok) throw new Error(await res.text());
      setData((await res.json()) as ScalePayload);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Failed to load");
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [days]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div className="space-y-10">
      <div className="flex flex-wrap items-center gap-3">
        <label className="text-xs text-slate-500">
          Period
          <select
            className="ml-2 rounded border border-slate-600 bg-slate-950 px-2 py-1 text-sm text-slate-100"
            value={days}
            onChange={(e) => setDays(Number(e.target.value))}
          >
            {[7, 14, 30, 60, 90].map((d) => (
              <option key={d} value={d}>
                {d} days
              </option>
            ))}
          </select>
        </label>
        <button
          type="button"
          onClick={() => void load()}
          className="rounded border border-slate-600 px-3 py-1 text-xs text-slate-200 hover:bg-slate-800"
        >
          Refresh
        </button>
      </div>

      {err && <p className="text-sm text-red-400">{err}</p>}
      {loading && !data && <p className="text-sm text-slate-500">Loading metrics…</p>}

      {data && (
        <>
          <section className="rounded-xl border border-slate-700 bg-slate-900/50 p-5">
            <h2 className="text-sm font-semibold text-slate-200">BNHUB marketplace</h2>
            <p className="mt-1 text-xs text-slate-500">Liquidity + bookings (confirmed/completed in period)</p>
            <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Stat label="Published listings" value={data.bnhub.listings.published} />
              <Stat label="Draft listings" value={data.bnhub.listings.draft} />
              <Stat label="Hosts (accounts)" value={data.bnhub.users.hosts} />
              <Stat label="Guest users" value={data.bnhub.users.guestUsers} />
              <Stat label="Bookings (period)" value={data.bnhub.bookings.confirmedOrCompletedInPeriod} />
              <Stat label="GMV (period)" value={money(data.bnhub.bookings.gmvCentsInPeriod)} />
              <Stat
                label="Avg booking"
                value={
                  data.bnhub.bookings.avgBookingValueCents != null
                    ? money(data.bnhub.bookings.avgBookingValueCents)
                    : "—"
                }
              />
              <Stat label="Signups (traffic)" value={data.bnhub.users.signupsInPeriod} />
              {data.domination?.revenuePerGuestUserCents != null ? (
                <Stat
                  label="GMV / guest user (rough)"
                  value={money(data.domination.revenuePerGuestUserCents)}
                />
              ) : null}
            </div>
          </section>

          {data.domination ? (
            <section className="rounded-xl border border-violet-500/30 bg-violet-950/20 p-5">
              <h2 className="text-sm font-semibold text-slate-200">100K domination markets</h2>
              <p className="mt-1 text-xs text-slate-500">
                Montreal → Canada rollout. Bookings + GMV attributed to listings in each geo filter.
              </p>
              <div className="mt-3 grid gap-3 sm:grid-cols-3">
                <Stat
                  label="Bookings / 1k listings (30d)"
                  value={data.domination.networkEffects.bookingsPerThousandListings ?? "—"}
                />
                <Stat label="Published (platform)" value={data.domination.networkEffects.publishedListings} />
                <Stat label="Bookings (30d, all)" value={data.domination.networkEffects.bookingsLast30d} />
              </div>
              <div className="mt-4 max-h-52 overflow-y-auto">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="border-b border-slate-700 text-slate-500">
                    <tr>
                      <th className="py-2 pr-2">City</th>
                      <th className="py-2 pr-2">Listings</th>
                      <th className="py-2 pr-2">Bookings</th>
                      <th className="py-2">GMV</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.domination.cityPerformance.map((row) => (
                      <tr key={row.key} className="border-b border-slate-800">
                        <td className="py-2 pr-2">
                          <Link href={`/${row.key}`} className="text-emerald-400 hover:text-emerald-300">
                            {row.displayName}
                          </Link>
                        </td>
                        <td className="pr-2">{row.publishedListings}</td>
                        <td className="pr-2">{row.bookingsInPeriod}</td>
                        <td>{money(row.gmvCentsInPeriod)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          ) : null}

          <section className="rounded-xl border border-slate-700 bg-slate-900/50 p-5">
            <h2 className="text-sm font-semibold text-slate-200">Marketplace balance</h2>
            <p className="mt-1 text-xs text-slate-500">
              Under-supplied metros → prioritize host ads and outbound. Top supply → guest campaigns.
            </p>
            <div className="mt-4 grid gap-6 lg:grid-cols-2">
              <div>
                <h3 className="text-xs font-medium uppercase text-amber-400/90">Need supply (&lt; {data.marketplaceBalance.minListingsPerCity} listings)</h3>
                <ul className="mt-2 max-h-48 overflow-y-auto text-xs text-slate-300">
                  {data.marketplaceBalance.underSuppliedCities.length === 0 ? (
                    <li className="text-slate-500">None — or no published inventory yet.</li>
                  ) : (
                    data.marketplaceBalance.underSuppliedCities.map((c) => (
                      <li key={`${c.city}-${c.country}`} className="border-b border-slate-800 py-1">
                        {c.city}, {c.country} — {c.publishedListings}
                      </li>
                    ))
                  )}
                </ul>
              </div>
              <div>
                <h3 className="text-xs font-medium uppercase text-emerald-400/90">Top supply</h3>
                <ul className="mt-2 max-h-48 overflow-y-auto text-xs text-slate-300">
                  {data.marketplaceBalance.topSupplyCities.map((c) => (
                    <li key={`${c.city}-${c.country}`} className="border-b border-slate-800 py-1">
                      {c.city}, {c.country} — {c.publishedListings}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </section>

          <section className="rounded-xl border border-slate-700 bg-slate-900/50 p-5">
            <h2 className="text-sm font-semibold text-slate-200">LECIPM funnel (traffic)</h2>
            <p className="mt-1 text-xs text-slate-500">
              Range {data.lecipm.range.start.slice(0, 10)} → {data.lecipm.range.end.slice(0, 10)}
            </p>
            <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Stat label="Visits" value={data.lecipm.totals.visits} />
              <Stat label="Signups" value={data.lecipm.totals.signups} />
              <Stat label="Revenue" value={money(data.lecipm.totals.revenueCents)} />
              <Stat label="Ad spend (manual CAD→¢)" value={money(data.lecipm.totals.adSpendCents)} />
              <Stat label="Visit→signup %" value={`${data.lecipm.conversion.visitToSignupPct}%`} />
              <Stat
                label="CAC / signup"
                value={
                  data.lecipm.costs.costPerSignupCents != null
                    ? money(data.lecipm.costs.costPerSignupCents)
                    : "—"
                }
              />
            </div>
            <h3 className="mt-6 text-xs font-medium uppercase text-slate-500">Channels</h3>
            <ul className="mt-2 flex max-h-40 flex-wrap gap-2 overflow-y-auto text-xs text-slate-400">
              {data.lecipm.channels.map((ch) => (
                <li key={ch.source} className="rounded border border-slate-700 px-2 py-1">
                  {ch.source}: {ch.count}
                </li>
              ))}
            </ul>
          </section>

          <section className="rounded-xl border border-slate-700 bg-slate-900/50 p-5">
            <h2 className="text-sm font-semibold text-slate-200">Supply by city (top 40)</h2>
            <div className="mt-3 max-h-56 overflow-y-auto text-xs text-slate-400">
              <table className="w-full text-left">
                <thead className="text-slate-500">
                  <tr>
                    <th className="py-1">City</th>
                    <th className="py-1">Published</th>
                  </tr>
                </thead>
                <tbody>
                  {data.bnhub.supplyByCity.map((r) => (
                    <tr key={r.city} className="border-t border-slate-800">
                      <td className="py-1 text-slate-300">{r.city}</td>
                      <td className="py-1">{r.publishedListings}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <p className="text-xs text-slate-500">
            Autopilot: <code className="text-slate-400">buildDailyAutopilotBrief</code> · Advanced:{" "}
            <code className="text-slate-400">buildAdvancedAutopilotBrief</code> (
            <code className="text-slate-400">services/growth/ai-autopilot-advanced</code>). Ops:{" "}
            <Link href="/admin/growth-crm" className="text-emerald-400 hover:text-emerald-300">
              Growth CRM
            </Link>
            . City LPs: /montreal, /laval, /quebec-city, /toronto, /vancouver
          </p>
        </>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg border border-slate-800 bg-slate-950/60 px-3 py-2">
      <p className="text-[10px] font-medium uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-1 text-lg font-semibold text-white">{value}</p>
    </div>
  );
}
