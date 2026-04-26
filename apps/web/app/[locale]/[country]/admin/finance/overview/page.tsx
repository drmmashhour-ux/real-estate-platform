import Link from "next/link";
import { redirect } from "next/navigation";
import { getGuestId, getUserRole } from "@/lib/auth/session";
import { getLegacyDB } from "@/lib/db/legacy";
const prisma = getLegacyDB();
import { isFinancialStaff } from "@/lib/admin/finance-access";
import { HubLayout } from "@/components/hub/HubLayout";
import { hubNavigation } from "@/lib/hub/navigation";
import { FinanceHubTabs } from "@/components/admin/FinanceHubTabs";
import { getAdminPeriodMetrics, getPeriodBounds } from "@/modules/finance/reporting";
import { getFullFinancialModel } from "@/modules/finance/investor-financial-model";
import { InvestorFinanceCharts } from "@/components/investor/InvestorFinanceCharts";

export const dynamic = "force-dynamic";

function cad(cents: number): string {
  return `$${(cents / 100).toLocaleString("en-CA", { maximumFractionDigits: 0 })}`;
}

export default async function AdminFinanceModelOverviewPage() {
  const userId = await getGuestId();
  if (!userId) redirect("/auth/login");
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { role: true, email: true } });
  if (!isFinancialStaff(user?.role)) redirect("/");
  const navRole = await getUserRole();

  const model = await getFullFinancialModel();
  const { payload, monthlyCosts, profit, aiSummary } = model;
  const pct = (part: number) =>
    payload.totalRevenueCents > 0 ? Math.round((part / payload.totalRevenueCents) * 1000) / 10 : 0;

  const monthRange = getPeriodBounds("monthly");
  const ops = await getAdminPeriodMetrics(monthRange);

  return (
    <HubLayout
      title="Finance"
      hubKey="admin"
      navigation={hubNavigation.admin}
      showAdminInSwitcher={navRole === "admin"}
    >
      <main className="min-h-screen bg-slate-950 text-slate-50">
        <div className="mx-auto max-w-6xl px-4 py-8">
          <Link href="/admin/dashboard" className="text-sm text-amber-400 hover:text-amber-300">
            ← Control center
          </Link>
          <h1 className="mt-4 text-2xl font-semibold">Financial model &amp; projections</h1>
          <p className="mt-1 text-sm text-slate-400">
            Internal operational view — same engine as investor hub, plus current-month activity.{payload.demoMode
              ? " Demo data blended where live revenue is low."
              : ""}
          </p>

          <FinanceHubTabs />

          <div className="mt-4 rounded-xl border border-amber-500/25 bg-amber-950/30 px-4 py-3 text-sm text-amber-100/90">
            This is an operational financial estimate. Not an audited statement. Use for decisions only with external
            validation for tax and statutory reporting.
          </div>

          <div className="mt-8 grid gap-3 rounded-2xl border border-slate-800 bg-slate-900/50 p-4 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <p className="text-xs uppercase text-slate-500">New users (MTD)</p>
              <p className="text-lg font-semibold text-white">{ops.newUsers}</p>
            </div>
            <div>
              <p className="text-xs uppercase text-slate-500">Platform payments paid (MTD)</p>
              <p className="text-lg font-semibold text-emerald-300">{ops.platformPaymentsPaidCount}</p>
            </div>
            <div>
              <p className="text-xs uppercase text-slate-500">Paid volume (MTD cents)</p>
              <p className="text-lg font-semibold text-slate-200">{ops.platformPaymentsPaidCents.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-xs uppercase text-slate-500">Leads created (MTD)</p>
              <p className="text-lg font-semibold text-slate-200">{ops.leadsCreated}</p>
            </div>
          </div>

          <div className="mt-8 rounded-2xl border border-premium-gold/25 bg-premium-gold/5 p-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-premium-gold">AI-style summary</p>
            <p className="mt-2 text-sm leading-relaxed text-slate-200">{aiSummary}</p>
          </div>

          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard label="Attributed revenue (rolling 12m)" value={cad(payload.totalRevenueCents)} accent />
            <StatCard label="Modeled costs (period)" value={cad(profit.costCents)} />
            <StatCard label="Net (operational)" value={cad(profit.netProfitCents)} positive={profit.netProfitCents >= 0} />
            <StatCard label="Revenue events (realized, period)" value={cad(payload.platformRevenueEventsCents)} />
          </div>

          <div className="mt-10">
            <h2 className="text-lg font-semibold text-white">Revenue by source</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {payload.revenueBySource.map((r) => (
                <div key={r.source} className="rounded-2xl border border-slate-800 bg-slate-900/40 p-5">
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{r.label}</p>
                  <p className="mt-2 text-2xl font-semibold tabular-nums text-premium-gold">{cad(r.totalCents)}</p>
                  <p className="mt-1 text-xs text-slate-500">{pct(r.totalCents)}% of total</p>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-10">
            <h2 className="text-lg font-semibold text-white">Modeled monthly costs</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <CostRow label="Hosting & infra" cents={monthlyCosts.hostingCents} />
              <CostRow label="AI / APIs" cents={monthlyCosts.aiApiCents} />
              <CostRow label="Marketing" cents={monthlyCosts.marketingCents} />
              <CostRow label="Team" cents={monthlyCosts.teamCents} />
              <CostRow label="Legal / ops" cents={monthlyCosts.legalOpsCents} />
              <div className="rounded-2xl border border-slate-700 bg-slate-900/60 p-5">
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Monthly total</p>
                <p className="mt-2 text-2xl font-semibold text-white">{cad(monthlyCosts.totalCents)}</p>
              </div>
            </div>
          </div>

          <div className="mt-10">
            <InvestorFinanceCharts model={model} />
          </div>

          <div className="mt-10 flex flex-wrap gap-3">
            <a
              href="/api/finance/model-export"
              className="rounded-lg border border-amber-700/50 bg-slate-900 px-4 py-2 text-sm text-amber-200 hover:bg-slate-800"
            >
              Export CSV
            </a>
            <a
              href="/api/finance/model-export?format=pdf"
              className="rounded-lg border border-amber-700/50 bg-slate-900 px-4 py-2 text-sm text-amber-200 hover:bg-slate-800"
            >
              Export PDF
            </a>
          </div>
        </div>
      </main>
    </HubLayout>
  );
}

function StatCard({
  label,
  value,
  accent,
  positive,
}: {
  label: string;
  value: string;
  accent?: boolean;
  positive?: boolean;
}) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-5">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p>
      <p
        className="mt-2 text-2xl font-semibold tabular-nums"
        style={{
          color: accent ? "var(--color-premium-gold)" : positive === false ? "#f87171" : positive === true ? "#4ade80" : "#f8fafc",
        }}
      >
        {value}
      </p>
    </div>
  );
}

function CostRow({ label, cents }: { label: string; cents: number }) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-5">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-2 text-lg font-semibold tabular-nums text-slate-200">{cad(cents)}</p>
    </div>
  );
}
