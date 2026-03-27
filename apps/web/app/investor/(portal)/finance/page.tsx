import { requireInvestorUser } from "@/lib/auth/require-investor";
import { getFullFinancialModel } from "@/modules/finance/investor-financial-model";
import { InvestorFinanceCharts } from "@/components/investor/InvestorFinanceCharts";

export const dynamic = "force-dynamic";

function cad(cents: number): string {
  return `$${(cents / 100).toLocaleString("en-CA", { maximumFractionDigits: 0 })}`;
}

export default async function InvestorFinancePage() {
  await requireInvestorUser();
  const model = await getFullFinancialModel();

  const { payload, monthlyCosts, profit, aiSummary } = model;
  const pct = (part: number) =>
    payload.totalRevenueCents > 0 ? Math.round((part / payload.totalRevenueCents) * 1000) / 10 : 0;

  return (
    <div>
      <h1 className="text-2xl font-semibold text-white">Financial model</h1>
      <p className="mt-1 text-sm text-slate-500">
        Operational estimates — not audited financial statements.{payload.demoMode ? " Includes demo data." : ""}
      </p>

      <div className="mt-4 rounded-xl border border-amber-500/25 bg-amber-500/5 px-4 py-3 text-sm text-amber-100/90">
        This is an operational financial estimate for internal and investor discussion. Final accounting must be
        validated externally.
      </div>

      <div className="mt-8 rounded-2xl border border-[#C9A646]/25 bg-[#C9A646]/5 p-5">
        <p className="text-xs font-semibold uppercase tracking-wide text-[#C9A646]">Summary</p>
        <p className="mt-2 text-sm leading-relaxed text-slate-200">{aiSummary}</p>
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total revenue (period)" value={cad(payload.totalRevenueCents)} accent />
        <StatCard label="Modeled costs (period)" value={cad(profit.costCents)} />
        <StatCard label="Net (operational)" value={cad(profit.netProfitCents)} positive={profit.netProfitCents >= 0} />
        <StatCard
          label="Bookings (count)"
          value={String(payload.bookingVolume.count)}
          sub={`Gross payments ${cad(payload.bookingVolume.grossCents)}`}
        />
      </div>

      <div className="mt-10">
        <h2 className="text-lg font-semibold text-white">Revenue breakdown</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {payload.revenueBySource.map((r) => (
            <div
              key={r.source}
              className="rounded-2xl border border-white/10 bg-white/[0.03] p-5"
            >
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{r.label}</p>
              <p className="mt-2 text-2xl font-semibold tabular-nums text-[#C9A646]">{cad(r.totalCents)}</p>
              <p className="mt-1 text-xs text-slate-500">{pct(r.totalCents)}% of total</p>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-10">
        <h2 className="text-lg font-semibold text-white">Cost breakdown (modeled monthly)</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <CostRow label="Hosting & infra" cents={monthlyCosts.hostingCents} />
          <CostRow label="AI / APIs" cents={monthlyCosts.aiApiCents} />
          <CostRow label="Marketing" cents={monthlyCosts.marketingCents} />
          <CostRow label="Team" cents={monthlyCosts.teamCents} />
          <CostRow label="Legal / ops" cents={monthlyCosts.legalOpsCents} />
          <div className="rounded-2xl border border-white/15 bg-white/[0.06] p-5">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Monthly total</p>
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
          className="rounded-xl border border-[#C9A646]/40 bg-[#C9A646]/10 px-4 py-2.5 text-sm font-medium text-[#C9A646] hover:bg-[#C9A646]/20"
        >
          Export CSV
        </a>
        <a
          href="/api/finance/model-export?format=pdf"
          className="rounded-xl border border-white/15 px-4 py-2.5 text-sm font-medium text-slate-300 hover:bg-white/5"
        >
          Export PDF
        </a>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  sub,
  accent,
  positive,
}: {
  label: string;
  value: string;
  sub?: string;
  accent?: boolean;
  positive?: boolean;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p>
      <p
        className="mt-2 text-2xl font-semibold tabular-nums"
        style={{
          color: accent ? "#C9A646" : positive === false ? "#f87171" : positive === true ? "#4ade80" : "#f8fafc",
        }}
      >
        {value}
      </p>
      {sub ? <p className="mt-1 text-xs text-slate-500">{sub}</p> : null}
    </div>
  );
}

function CostRow({ label, cents }: { label: string; cents: number }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-2 text-lg font-semibold tabular-nums text-slate-200">{cad(cents)}</p>
    </div>
  );
}
