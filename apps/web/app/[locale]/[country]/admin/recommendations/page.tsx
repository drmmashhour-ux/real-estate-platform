import Link from "next/link";
import { getRecommendationAdminStats } from "@/lib/recommendations/admin-stats";

export const dynamic = "force-dynamic";

export default async function AdminRecommendationsPage() {
  const stats = await getRecommendationAdminStats(7);

  return (
    <main className="min-h-screen bg-slate-950 text-slate-50">
      <div className="mx-auto max-w-5xl px-4 py-8">
        <Link href="/admin" className="text-sm text-amber-400 hover:text-amber-300">
          ← Admin
        </Link>
        <h1 className="mt-4 text-2xl font-semibold">Recommendations</h1>
        <p className="mt-1 text-slate-400">
          Widget engagement from <code className="rounded bg-slate-800 px-1">SearchEvent</code> metadata (
          <code className="rounded bg-slate-800 px-1">reco: true</code>) — last {stats.periodDays} days.
        </p>

        <section className="mt-8 rounded-xl border border-slate-800 bg-slate-900/50 p-6">
          <h2 className="text-lg font-semibold text-white">CTR by source</h2>
          <ul className="mt-4 space-y-2 text-sm">
            {Object.entries(stats.bySource).map(([k, v]) => (
              <li key={k} className="flex justify-between gap-4 border-b border-slate-800/80 py-1">
                <span className="text-slate-300">{k}</span>
                <span className="text-slate-400">
                  imp {v.impressions} · clk {v.clicks} · ctr {(v.ctr * 100).toFixed(2)}%
                </span>
              </li>
            ))}
          </ul>
        </section>

        <section className="mt-6 rounded-xl border border-slate-800 bg-slate-900/50 p-6">
          <h2 className="text-lg font-semibold text-white">Top recommended listings (impressions)</h2>
          <ul className="mt-3 space-y-1 font-mono text-xs text-slate-400">
            {stats.topListingIds.map((r) => (
              <li key={r.listingId}>
                {r.listingId.slice(0, 12)}… — imp {r.impressions} / clk {r.clicks}
              </li>
            ))}
          </ul>
        </section>

        <section className="mt-6 rounded-xl border border-slate-800 bg-slate-900/50 p-6">
          <h2 className="text-lg font-semibold text-white">Lowest CTR widgets (min 8 impressions)</h2>
          <ul className="mt-3 space-y-2 text-sm text-slate-400">
            {stats.lowCtrWidgets.map((w) => (
              <li key={w.widget} className="flex justify-between gap-2">
                <span className="text-emerald-200/90">{w.widget}</span>
                <span>
                  ctr {(w.ctr * 100).toFixed(2)}% ({w.clicks}/{w.impressions})
                </span>
              </li>
            ))}
          </ul>
        </section>

        <p className="mt-8 text-xs text-slate-600">
          Booking attribution from recommendations requires checkout metadata — planned. See docs/audits/recommendation-engine.md.
        </p>
      </div>
    </main>
  );
}
