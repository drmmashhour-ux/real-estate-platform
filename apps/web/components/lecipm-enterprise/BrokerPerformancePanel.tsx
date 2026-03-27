"use client";

export type BrokerPerformanceRow = {
  userId: string;
  label: string;
  dealsTotal: number;
  dealsClosed: number;
  conversionRate: number;
  activityLevel: number;
  avgResponseHours: number | null;
};

export function BrokerPerformancePanel({ rows }: { rows: BrokerPerformanceRow[] }) {
  if (rows.length === 0) {
    return <p className="text-sm text-slate-500">No broker-attributed deals in this workspace scope.</p>;
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-white/10">
      <table className="min-w-full text-left text-sm text-slate-200">
        <thead className="border-b border-white/10 bg-white/[0.03] text-xs uppercase tracking-wide text-slate-400">
          <tr>
            <th className="px-4 py-3 font-medium">Broker</th>
            <th className="px-4 py-3 font-medium">Closed</th>
            <th className="px-4 py-3 font-medium">Conversion</th>
            <th className="px-4 py-3 font-medium">Activity</th>
            <th className="px-4 py-3 font-medium">Avg response (h)</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.userId} className="border-b border-white/5 last:border-0">
              <td className="px-4 py-3 font-medium text-slate-100">{r.label}</td>
              <td className="px-4 py-3 text-slate-300">
                {r.dealsClosed} / {r.dealsTotal}
              </td>
              <td className="px-4 py-3 text-slate-300">{(r.conversionRate * 100).toFixed(0)}%</td>
              <td className="px-4 py-3 text-slate-300">{r.activityLevel}</td>
              <td className="px-4 py-3 text-slate-400">
                {r.avgResponseHours != null ? r.avgResponseHours.toFixed(1) : "—"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
