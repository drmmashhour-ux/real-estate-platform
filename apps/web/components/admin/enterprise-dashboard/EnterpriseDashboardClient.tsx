"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";

type Payload = {
  rangeDays: number;
  enterprise: {
    since: string;
    users: { hosts: number; guestUsers: number; signupsInPeriod: number };
    listingsByRegion: { country: string; published: number; draft: number }[];
    bookings: { totalInPeriod: number; gmvCentsInPeriod: number };
    bookingsByRegion: { country: string; bookings: number; gmvCents: number }[];
    retention: {
      guestsWithBookingsInPeriod: number;
      guestsWithTwoPlusBookingsInPeriod: number;
    };
  };
  funnel: {
    visits: number;
    signups: number;
    revenueCents: number;
    conversion: Record<string, number>;
    costs: { costPerSignupCents: number | null };
    channels: { source: string; count: number }[];
  };
};

function money(cents: number) {
  return (cents / 100).toLocaleString(undefined, { style: "currency", currency: "USD", maximumFractionDigits: 0 });
}

export function EnterpriseDashboardClient() {
  const [days, setDays] = useState(30);
  const [data, setData] = useState<Payload | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    setErr(null);
    try {
      const res = await fetch(`/api/admin/enterprise/metrics?days=${days}`, { credentials: "same-origin" });
      if (!res.ok) throw new Error(await res.text());
      setData((await res.json()) as Payload);
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

  const e = data?.enterprise;
  const repeatRate =
    e && e.retention.guestsWithBookingsInPeriod > 0
      ? Math.round(
          (e.retention.guestsWithTwoPlusBookingsInPeriod / e.retention.guestsWithBookingsInPeriod) * 1000
        ) / 10
      : null;

  return (
    <div className="space-y-10">
      <div className="flex flex-wrap items-center gap-3">
        <label className="text-xs text-slate-500">
          Period
          <select
            className="ml-2 rounded border border-slate-600 bg-slate-950 px-2 py-1 text-sm text-slate-100"
            value={days}
            onChange={(ev) => setDays(Number(ev.target.value))}
          >
            {[7, 14, 30, 60, 90, 180].map((d) => (
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
      {loading && !data && <p className="text-sm text-slate-500">Loading…</p>}

      {data && e && (
        <>
          <section className="rounded-xl border border-slate-700 bg-slate-900/50 p-5">
            <h2 className="text-sm font-semibold text-slate-200">Users (global)</h2>
            <p className="mt-1 text-xs text-slate-500">Regional user splits require profile/geo fields — listings use `country` below.</p>
            <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Stat label="Hosts" value={e.users.hosts} />
              <Stat label="Guest-role users" value={e.users.guestUsers} />
              <Stat label="Signups (traffic)" value={e.users.signupsInPeriod} />
              <Stat label="Bookings (period)" value={e.bookings.totalInPeriod} />
              <Stat label="GMV (period)" value={money(e.bookings.gmvCentsInPeriod)} />
            </div>
          </section>

          <section className="rounded-xl border border-slate-700 bg-slate-900/50 p-5">
            <h2 className="text-sm font-semibold text-slate-200">Listings by region</h2>
            <p className="mt-1 text-xs text-slate-500">`ShortTermListing.country` — tune defaults (CA/US) for accurate rollout tracking.</p>
            <div className="mt-3 max-h-64 overflow-y-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="border-b border-slate-700 text-slate-500">
                  <tr>
                    <th className="py-2 pr-2">Country</th>
                    <th className="py-2 pr-2">Published</th>
                    <th className="py-2">Draft</th>
                  </tr>
                </thead>
                <tbody>
                  {e.listingsByRegion.map((r) => (
                    <tr key={r.country} className="border-b border-slate-800">
                      <td className="py-2 pr-2 font-mono">{r.country}</td>
                      <td className="pr-2">{r.published}</td>
                      <td>{r.draft}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className="rounded-xl border border-slate-700 bg-slate-900/50 p-5">
            <h2 className="text-sm font-semibold text-slate-200">Bookings &amp; GMV by listing region</h2>
            <div className="mt-3 max-h-64 overflow-y-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="border-b border-slate-700 text-slate-500">
                  <tr>
                    <th className="py-2 pr-2">Country</th>
                    <th className="py-2 pr-2">Bookings</th>
                    <th className="py-2">GMV</th>
                  </tr>
                </thead>
                <tbody>
                  {e.bookingsByRegion.map((r) => (
                    <tr key={r.country} className="border-b border-slate-800">
                      <td className="py-2 pr-2 font-mono">{r.country}</td>
                      <td className="pr-2">{r.bookings}</td>
                      <td>{money(r.gmvCents)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className="rounded-xl border border-slate-700 bg-slate-900/50 p-5">
            <h2 className="text-sm font-semibold text-slate-200">Retention (guests, period)</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-3">
              <Stat label="Guests with ≥1 booking" value={e.retention.guestsWithBookingsInPeriod} />
              <Stat label="Guests with ≥2 bookings" value={e.retention.guestsWithTwoPlusBookingsInPeriod} />
              <Stat label="Repeat share (approx.)" value={repeatRate != null ? `${repeatRate}%` : "—"} />
            </div>
          </section>

          <section className="rounded-xl border border-slate-700 bg-slate-900/50 p-5">
            <h2 className="text-sm font-semibold text-slate-200">Conversion funnel (LECIPM traffic)</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Stat label="Visits" value={data.funnel.visits} />
              <Stat label="Signups" value={data.funnel.signups} />
              <Stat label="Visit→signup %" value={`${data.funnel.conversion.visitToSignupPct}%`} />
              <Stat
                label="CAC / signup"
                value={
                  data.funnel.costs.costPerSignupCents != null
                    ? money(data.funnel.costs.costPerSignupCents)
                    : "—"
                }
              />
            </div>
            <h3 className="mt-4 text-xs font-medium uppercase text-slate-500">Channels</h3>
            <ul className="mt-2 flex flex-wrap gap-2 text-xs text-slate-400">
              {data.funnel.channels.map((ch) => (
                <li key={ch.source} className="rounded border border-slate-700 px-2 py-1">
                  {ch.source}: {ch.count}
                </li>
              ))}
            </ul>
          </section>

          <p className="text-xs text-slate-500">
            Automation (auditable):{" "}
            <code className="text-slate-400">apps/web/services/automation/*</code> · Growth:{" "}
            <Link href="/admin/growth-dashboard" className="text-emerald-400 hover:text-emerald-300">
              Growth dashboard
            </Link>
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
