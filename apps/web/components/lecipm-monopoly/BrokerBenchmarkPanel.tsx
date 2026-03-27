"use client";

export type BenchmarkBrokerRow = {
  brokerUserId: string;
  label: string;
  dealsOpenOrActive: number;
  dealsClosed: number;
  avgPriceCents: number | null;
  leadTouches: number;
  reputation: {
    score: number;
    successRate: number;
    activityScore: number;
    dealsCounted: number;
  } | null;
};

export function BrokerBenchmarkPanel({ rows }: { rows: BenchmarkBrokerRow[] }) {
  if (rows.length === 0) {
    return <p className="text-sm text-slate-500">No broker-attributed deals in your current scope.</p>;
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-white/10">
      <table className="min-w-full text-left text-sm text-slate-200">
        <thead className="border-b border-white/10 bg-white/[0.03] text-xs uppercase tracking-wide text-slate-400">
          <tr>
            <th className="px-4 py-3 font-medium">Broker</th>
            <th className="px-4 py-3 font-medium">Rep score</th>
            <th className="px-4 py-3 font-medium">Win rate (history)</th>
            <th className="px-4 py-3 font-medium">Deals</th>
            <th className="px-4 py-3 font-medium">Leads</th>
            <th className="px-4 py-3 font-medium">Avg price</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.brokerUserId} className="border-b border-white/5 last:border-0">
              <td className="px-4 py-3 font-medium text-slate-100">{r.label}</td>
              <td className="px-4 py-3 text-[#C9A646]">
                {r.reputation != null ? Math.round(r.reputation.score) : "—"}
              </td>
              <td className="px-4 py-3 text-slate-300">
                {r.reputation != null ? `${Math.round(r.reputation.successRate * 100)}%` : "—"}
              </td>
              <td className="px-4 py-3 text-slate-400">
                {r.dealsClosed}/{r.dealsOpenOrActive}
              </td>
              <td className="px-4 py-3 text-slate-400">{r.leadTouches}</td>
              <td className="px-4 py-3 text-slate-500">
                {r.avgPriceCents != null ? `$${(r.avgPriceCents / 100).toLocaleString()}` : "—"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
