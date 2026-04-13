import Link from "next/link";
import { redirect } from "next/navigation";
import { getGuestId } from "@/lib/auth/session";
import { isPlatformAdminSurface } from "@/lib/auth/is-platform-admin";
import { getFunnelSnapshot } from "@/lib/funnel/funnel-dashboard";

export const dynamic = "force-dynamic";

export default async function AdminFunnelPage() {
  const uid = await getGuestId();
  if (!uid || !(await isPlatformAdminSurface(uid))) redirect("/admin");

  const snap = await getFunnelSnapshot(30);

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-10 text-slate-100 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-400">Conversion</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">Full funnel</h1>
        <p className="mt-2 max-w-2xl text-sm text-slate-400">
          Events from <code className="text-slate-500">analytics_events</code> (last 30 days, since{" "}
          {snap.since.slice(0, 10)}). Retargeting rows are user×listing pairs missing the next step.
        </p>
        <div className="mt-6 flex flex-wrap gap-3 text-sm">
          <Link href="/admin" className="text-emerald-400 hover:text-emerald-300">
            ← Admin home
          </Link>
          <Link href="/admin/analytics" className="text-slate-400 hover:text-slate-200">
            Traffic analytics
          </Link>
        </div>

        <section className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {(Object.entries(snap.counts) as [string, number][]).map(([k, v]) => (
            <div key={k} className="rounded-xl border border-slate-800 bg-slate-900/50 p-4">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">{k}</p>
              <p className="mt-1 text-2xl font-semibold text-white">{v.toLocaleString()}</p>
            </div>
          ))}
        </section>

        <section className="mt-10">
          <h2 className="text-lg font-semibold text-white">Step conversion (sequential heuristic)</h2>
          <ul className="mt-4 space-y-2 text-sm text-slate-300">
            {snap.rates.map((r) => (
              <li key={`${r.from}-${r.to}`}>
                {r.from} → {r.to}:{" "}
                <span className="font-mono text-emerald-300">{r.pct != null ? `${r.pct}%` : "—"}</span> of prior step
                volume
              </li>
            ))}
          </ul>
        </section>

        <section className="mt-10">
          <h2 className="text-lg font-semibold text-white">Drop-off (volume loss between adjacent steps)</h2>
          <p className="mt-1 text-xs text-slate-500">
            Steps are not strict subsets (e.g. visits can occur without a stored contact event). Use as a directional
            diagnostic, not a literal waterfall.
          </p>
          <ul className="mt-4 space-y-2 text-sm text-slate-300">
            {snap.dropOffs.map((d) => (
              <li key={d.step}>
                {d.step}: <span className="text-amber-300">{d.lost.toLocaleString()}</span> lost
                {d.pctOfPrior != null ? (
                  <span className="text-slate-500"> ({d.pctOfPrior}% of prior)</span>
                ) : null}
              </li>
            ))}
          </ul>
        </section>

        <section className="mt-10">
          <h2 className="text-lg font-semibold text-white">A/B — listing view → contact (by variant)</h2>
          <p className="mt-1 text-xs text-slate-500">
            Variant is deterministic per listing id (split A/B for CTA copy experiments).
          </p>
          <div className="mt-4 overflow-x-auto rounded-xl border border-slate-800">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-slate-900/80 text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-4 py-2">Variant</th>
                  <th className="px-4 py-2">Views</th>
                  <th className="px-4 py-2">Contacts</th>
                  <th className="px-4 py-2">Rate</th>
                </tr>
              </thead>
              <tbody>
                {snap.abListingViewToContact.map((row) => (
                  <tr key={row.variant ?? "null"} className="border-t border-slate-800">
                    <td className="px-4 py-2 font-mono text-slate-200">{row.variant ?? "(unset)"}</td>
                    <td className="px-4 py-2">{row.views}</td>
                    <td className="px-4 py-2">{row.contacts}</td>
                    <td className="px-4 py-2 text-emerald-300">{row.ratePct != null ? `${row.ratePct}%` : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="mt-10">
          <h2 className="text-lg font-semibold text-white">Retargeting signals (pair counts)</h2>
          <p className="mt-1 text-xs text-slate-500">
            Data layer for campaigns — wire ESP / ads to these cohorts. Pairs are distinct user + listing where the
            next event never occurred in the window.
          </p>
          <ul className="mt-4 grid gap-3 sm:grid-cols-3">
            <li className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4">
              <p className="text-xs uppercase text-amber-200/80">Viewed, no contact</p>
              <p className="mt-1 text-2xl font-semibold text-white">
                {snap.retargeting.viewedNoContactPairs.toLocaleString()}
              </p>
            </li>
            <li className="rounded-xl border border-sky-500/20 bg-sky-500/5 p-4">
              <p className="text-xs uppercase text-sky-200/80">Contacted, no visit</p>
              <p className="mt-1 text-2xl font-semibold text-white">
                {snap.retargeting.contactedNoVisitPairs.toLocaleString()}
              </p>
            </li>
            <li className="rounded-xl border border-violet-500/20 bg-violet-500/5 p-4">
              <p className="text-xs uppercase text-violet-200/80">Visit confirmed, no deal</p>
              <p className="mt-1 text-2xl font-semibold text-white">
                {snap.retargeting.visitedNoDealPairs.toLocaleString()}
              </p>
            </li>
          </ul>
        </section>

        <section className="mt-10">
          <h2 className="text-lg font-semibold text-white">Top listings by contact_click</h2>
          <div className="mt-4 overflow-x-auto rounded-xl border border-slate-800">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-slate-900/80 text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-4 py-2">Listing ID</th>
                  <th className="px-4 py-2">Contacts</th>
                  <th className="px-4 py-2">Views (same window)</th>
                </tr>
              </thead>
              <tbody>
                {snap.topListingsByContact.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="px-4 py-6 text-slate-500">
                      No data yet.
                    </td>
                  </tr>
                ) : (
                  snap.topListingsByContact.map((row) => (
                    <tr key={row.listingId} className="border-t border-slate-800">
                      <td className="px-4 py-2 font-mono text-xs text-slate-300">{row.listingId}</td>
                      <td className="px-4 py-2">{row.contacts}</td>
                      <td className="px-4 py-2">{row.views}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </main>
  );
}
