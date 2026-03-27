import Link from "next/link";
import { redirect } from "next/navigation";
import { getGuestId } from "@/lib/auth/session";
import { requireAdminUser } from "@/modules/analytics/services/require-admin";
import { getGrowthTrackingDashboard } from "@/modules/analytics/services/growth-tracking-dashboard";

export const dynamic = "force-dynamic";

export default async function GrowthTrackingPage() {
  const uid = await getGuestId();
  const admin = await requireAdminUser(uid);
  if (!admin) redirect("/admin");

  const data = await getGrowthTrackingDashboard(30);

  return (
    <main className="mx-auto max-w-6xl px-4 py-10 text-slate-100">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#C9A646]">Ads + Growth</p>
      <h1 className="mt-2 text-3xl font-semibold">Acquisition and conversion tracking</h1>
      <p className="mt-2 text-sm text-slate-400">
        Visit → Signup → Analysis → Lead → Purchase funnel with revenue + cost metrics.
      </p>
      <Link href="/admin/growth-engine" className="mt-3 inline-block text-sm text-emerald-400 hover:text-emerald-300">
        ← Back to growth engine
      </Link>

      <section className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card label="Visits" value={fmtInt(data.totals.visits)} />
        <Card label="Signups" value={fmtInt(data.totals.signups)} />
        <Card label="Analyses" value={fmtInt(data.totals.analyses)} />
        <Card label="Lead purchases" value={fmtInt(data.totals.leadPurchases)} />
        <Card label="Paid subscriptions" value={fmtInt(data.totals.paidSubscriptions)} />
        <Card label="Revenue" value={fmtMoney(data.totals.revenueCents)} />
        <Card label="Cost / signup" value={fmtMaybeMoney(data.costs.costPerSignupCents)} />
        <Card label="Cost / lead" value={fmtMaybeMoney(data.costs.costPerLeadCents)} />
      </section>

      <section className="mt-8 rounded-xl border border-white/10 bg-black/30 p-5">
        <h2 className="text-lg font-medium">Conversion rates</h2>
        <ul className="mt-3 space-y-2 text-sm text-slate-300">
          <li>Visit → Signup: {data.conversion.visitToSignupPct}%</li>
          <li>Signup → Analysis: {data.conversion.signupToAnalysisPct}%</li>
          <li>Analysis → Lead: {data.conversion.analysisToLeadPct}%</li>
          <li>Lead → Purchase: {data.conversion.leadToPurchasePct}%</li>
        </ul>
      </section>

      <section className="mt-8 rounded-xl border border-white/10 bg-black/30 p-5">
        <h2 className="text-lg font-medium">Top acquisition sources</h2>
        {data.channels.length === 0 ? (
          <p className="mt-3 text-sm text-slate-500">No channel data yet.</p>
        ) : (
          <div className="mt-3 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-white/10 text-slate-400">
                  <th className="py-2 pr-4">Source</th>
                  <th className="py-2 pr-4">Events</th>
                </tr>
              </thead>
              <tbody>
                {data.channels.map((row) => (
                  <tr key={row.source} className="border-b border-white/5">
                    <td className="py-2 pr-4 text-slate-200">{row.source}</td>
                    <td className="py-2 pr-4 text-slate-300">{row.count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}

function Card({ label, value }: { label: string; value: string }) {
  return (
    <article className="rounded-xl border border-white/10 bg-black/30 p-4">
      <p className="text-xs uppercase tracking-wide text-slate-400">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-slate-100">{value}</p>
    </article>
  );
}

function fmtInt(n: number): string {
  return n.toLocaleString();
}
function fmtMoney(cents: number): string {
  return `$${(cents / 100).toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
}
function fmtMaybeMoney(cents: number | null): string {
  if (cents == null) return "—";
  return fmtMoney(cents);
}
