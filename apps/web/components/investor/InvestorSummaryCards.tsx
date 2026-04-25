"use client";

type Props = {
  totalRevenue: number;
  wonDeals: number;
  pipeline: number | null;
  leadSpend: number | null;
  className?: string;
};

function cad(n: number) {
  return new Intl.NumberFormat("en-CA", { style: "currency", currency: "CAD", maximumFractionDigits: 0 }).format(n);
}

export function InvestorSummaryCards({ totalRevenue, wonDeals, pipeline, leadSpend, className }: Props) {
  return (
    <div className={`grid gap-3 sm:grid-cols-2 lg:grid-cols-4 ${className ?? ""}`} data-testid="investor-summary-cards">
      <div className="rounded-xl border border-slate-200 bg-white p-4 text-sm shadow-sm">
        <p className="text-xs uppercase text-slate-500">Revenue (closed-won attr., sample)</p>
        <p className="mt-1 text-xl font-semibold text-slate-900">{cad(totalRevenue)}</p>
      </div>
      <div className="rounded-xl border border-slate-200 bg-white p-4 text-sm shadow-sm">
        <p className="text-xs uppercase text-slate-500">Won deals (90d count)</p>
        <p className="mt-1 text-xl font-semibold text-slate-900">{wonDeals}</p>
      </div>
      <div className="rounded-xl border border-slate-200 bg-white p-4 text-sm shadow-sm">
        <p className="text-xs uppercase text-slate-500">Open pipeline (rough notional)</p>
        <p className="mt-1 text-xl font-semibold text-slate-900">{pipeline != null ? cad(pipeline) : "—"}</p>
      </div>
      <div className="rounded-xl border border-slate-200 bg-white p-4 text-sm shadow-sm">
        <p className="text-xs uppercase text-slate-500">Lead spend (proxy, if)</p>
        <p className="mt-1 text-xl font-semibold text-slate-900">{leadSpend != null ? cad(leadSpend) : "—"}</p>
      </div>
    </div>
  );
}
