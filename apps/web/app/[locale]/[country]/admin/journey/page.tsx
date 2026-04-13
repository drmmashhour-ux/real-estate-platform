import Link from "next/link";
import { redirect } from "next/navigation";
import { getGuestId } from "@/lib/auth/session";
import { isPlatformAdminSurface } from "@/lib/auth/is-platform-admin";
import { getBnhubJourneySnapshot } from "@/lib/journey/bnhub-journey-snapshot";

export const dynamic = "force-dynamic";

export default async function AdminJourneyPage() {
  const uid = await getGuestId();
  if (!uid || !(await isPlatformAdminSurface(uid))) redirect("/admin");

  const snap = await getBnhubJourneySnapshot(14);

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-10 text-slate-100 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-sky-400">Journey optimization</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">BNHub user journey</h1>
        <p className="mt-2 max-w-2xl text-sm text-slate-400">
          Funnel from <code className="text-slate-500">analytics_events</code> — last {snap.days} days (since{" "}
          {snap.since.slice(0, 10)}). Steps use <code className="text-slate-500">metadata.journey = bnhub</code> where
          applicable.
        </p>
        <div className="mt-6 flex flex-wrap gap-3 text-sm">
          <Link href="/admin" className="text-emerald-400 hover:text-emerald-300">
            ← Admin home
          </Link>
          <Link href="/admin/funnel" className="text-slate-400 hover:text-slate-200">
            Legacy marketplace funnel
          </Link>
          <Link href="/admin/recommendations" className="text-slate-400 hover:text-slate-200">
            Recommendations
          </Link>
        </div>

        <section className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Object.entries(snap.counts).map(([k, v]) => (
            <div key={k} className="rounded-xl border border-slate-800 bg-slate-900/50 p-4">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">{k}</p>
              <p className="mt-1 text-2xl font-semibold text-white">{v.toLocaleString()}</p>
            </div>
          ))}
        </section>

        <section className="mt-10">
          <h2 className="text-lg font-semibold text-white">Step conversion</h2>
          <ul className="mt-4 space-y-2 text-sm text-slate-300">
            {snap.rates.map((r) => (
              <li key={`${r.from}-${r.to}`}>
                {r.from} → {r.to}:{" "}
                <span className="font-mono text-sky-300">{r.pct != null ? `${r.pct}%` : "—"}</span> of prior step
              </li>
            ))}
          </ul>
        </section>

        <section className="mt-10">
          <h2 className="text-lg font-semibold text-white">Drop-offs (heuristic)</h2>
          <ul className="mt-4 space-y-2 text-sm text-slate-300">
            {snap.dropOffs.map((d) => (
              <li key={d.step}>
                {d.step}: <span className="text-amber-300">{d.lost.toLocaleString()}</span> volume gap
                {d.pctOfPrior != null ? (
                  <span className="text-slate-500"> ({d.pctOfPrior}% of prior)</span>
                ) : null}
              </li>
            ))}
          </ul>
        </section>

        <section className="mt-10 rounded-xl border border-amber-500/20 bg-amber-500/5 p-6">
          <h2 className="text-lg font-semibold text-amber-100">Improvements suggested</h2>
          <ul className="mt-3 list-inside list-disc space-y-2 text-sm text-amber-100/90">
            {snap.improvements.map((line, i) => (
              <li key={`imp-${i}`}>{line}</li>
            ))}
          </ul>
        </section>

        <section className="mt-10 rounded-xl border border-slate-800 bg-slate-900/40 p-6">
          <h2 className="text-lg font-semibold text-white">Follow-up & retention</h2>
          <p className="mt-2 text-sm text-slate-400">
            In-app browse nudges and post-booking follow-ups use <code className="text-slate-500">SearchEvent</code>,{" "}
            <code className="text-slate-500">notifications</code>, and{" "}
            <code className="rounded bg-slate-800 px-1">lib/bnhub/bnhub-retention-followups.ts</code> (batch jobs).
          </p>
          <p className="mt-3 text-sm text-slate-500">
            Wire cron to run retention batches; journey events here inform where to tune copy and timing.
          </p>
        </section>

        <section className="mt-10 rounded-xl border border-slate-800 bg-slate-900/40 p-6">
          <h2 className="text-lg font-semibold text-white">Product surfacing</h2>
          <ul className="mt-3 list-inside list-disc space-y-1 text-sm text-slate-400">
            <li>Personalized rails: home + buyer dashboard (recommendations module).</li>
            <li>Trust: checkout shows TrustStrip, Stripe hints, and host signals on listing pages.</li>
            <li>Sticky booking: mobile sticky bar on stay detail when configured.</li>
          </ul>
        </section>
      </div>
    </main>
  );
}
