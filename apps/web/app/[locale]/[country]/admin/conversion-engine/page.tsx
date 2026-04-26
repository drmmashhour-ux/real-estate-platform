import { redirect } from "next/navigation";
import { getLegacyDB } from "@/lib/db/legacy";
const prisma = getLegacyDB();
import { getGuestId } from "@/lib/auth/session";
import { requireAdminUser } from "@/modules/analytics/services/require-admin";
import { getGrowthTrackingDashboard } from "@/modules/analytics/services/growth-tracking-dashboard";

export const dynamic = "force-dynamic";

export default async function ConversionEngineAdminPage() {
  const uid = await getGuestId();
  const admin = await requireAdminUser(uid);
  if (!admin) redirect("/admin");

  const [growth, triggers] = await Promise.all([
    getGrowthTrackingDashboard(30),
    prisma.conversionAutomationLog.groupBy({
      by: ["triggerType"],
      _count: { _all: true },
      where: { createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } },
    }),
  ]);

  return (
    <main className="mx-auto max-w-5xl px-4 py-10 text-slate-100">
      <h1 className="text-2xl font-semibold">Conversion Optimization Dashboard</h1>
      <p className="mt-2 text-sm text-slate-400">Visitor to paid funnel, drop-off rates, and best-performing triggers.</p>

      <section className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Kpi label="Visits" value={growth.totals.visits} />
        <Kpi label="Signups" value={growth.totals.signups} />
        <Kpi label="Analyses" value={growth.totals.analyses} />
        <Kpi label="Lead/Paid" value={growth.totals.leadPurchases + growth.totals.paidSubscriptions} />
      </section>

      <section className="mt-6 rounded-xl border border-white/10 bg-black/30 p-4 text-sm">
        <p>Signup → Analysis: {growth.conversion.signupToAnalysisPct}%</p>
        <p>Analysis → Lead: {growth.conversion.analysisToLeadPct}%</p>
        <p>Lead → Paid: {growth.conversion.leadToPurchasePct}%</p>
      </section>

      <section className="mt-6 rounded-xl border border-white/10 bg-black/30 p-4">
        <h2 className="text-lg font-medium">Best Triggers (last 30d)</h2>
        <ul className="mt-3 space-y-2 text-sm">
          {triggers
            .sort((a, b) => b._count._all - a._count._all)
            .slice(0, 8)
            .map((t) => (
              <li key={t.triggerType} className="flex items-center justify-between border-b border-white/5 py-2">
                <span>{t.triggerType}</span>
                <span className="text-slate-400">{t._count._all}</span>
              </li>
            ))}
        </ul>
      </section>
    </main>
  );
}

function Kpi({ label, value }: { label: string; value: number }) {
  return (
    <article className="rounded-lg border border-white/10 bg-black/30 p-4">
      <p className="text-xs uppercase tracking-wide text-slate-400">{label}</p>
      <p className="mt-1 text-2xl font-semibold">{value}</p>
    </article>
  );
}
