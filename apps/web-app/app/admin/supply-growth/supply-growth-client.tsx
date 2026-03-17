"use client";

type Metric = {
  date: string | Date;
  newListings: number;
  newHosts: number;
  referralSignups: number;
  totalListings: number;
  totalHosts: number;
};

export function SupplyGrowthClient({ initialMetrics }: { initialMetrics: Metric[] }) {
  if (initialMetrics.length === 0) {
    return (
      <div className="mt-6 rounded-xl border border-slate-800 bg-slate-900/60 p-8 text-center text-slate-500">
        No metrics yet. Use POST /api/bnhub/supply-growth to record daily snapshots.
      </div>
    );
  }

  const latest = initialMetrics[0];
  const totalReferrals = initialMetrics.reduce((s, m) => s + m.referralSignups, 0);

  return (
    <div className="mt-6 space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
          <p className="text-xs font-medium uppercase text-slate-500">Total listings (latest)</p>
          <p className="mt-1 text-2xl font-semibold text-slate-100">{latest.totalListings}</p>
        </div>
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
          <p className="text-xs font-medium uppercase text-slate-500">Total hosts (latest)</p>
          <p className="mt-1 text-2xl font-semibold text-slate-100">{latest.totalHosts}</p>
        </div>
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
          <p className="text-xs font-medium uppercase text-slate-500">Referral signups (30d)</p>
          <p className="mt-1 text-2xl font-semibold text-emerald-300">{totalReferrals}</p>
        </div>
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
          <p className="text-xs font-medium uppercase text-slate-500">New listings (30d)</p>
          <p className="mt-1 text-2xl font-semibold text-slate-100">
            {initialMetrics.reduce((s, m) => s + m.newListings, 0)}
          </p>
        </div>
      </div>
      <div className="rounded-xl border border-slate-800 bg-slate-900/60 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-800 bg-slate-800/50">
              <th className="px-4 py-2 text-left font-medium text-slate-300">Date</th>
              <th className="px-4 py-2 text-right font-medium text-slate-300">New listings</th>
              <th className="px-4 py-2 text-right font-medium text-slate-300">New hosts</th>
              <th className="px-4 py-2 text-right font-medium text-slate-300">Referrals</th>
            </tr>
          </thead>
          <tbody>
            {initialMetrics.slice(0, 14).map((m) => (
              <tr key={typeof m.date === "string" ? m.date : (m.date as Date).toISOString()} className="border-b border-slate-800/60">
                <td className="px-4 py-2 text-slate-400">{new Date(m.date as string).toLocaleDateString()}</td>
                <td className="px-4 py-2 text-right text-slate-300">{m.newListings}</td>
                <td className="px-4 py-2 text-right text-slate-300">{m.newHosts}</td>
                <td className="px-4 py-2 text-right text-slate-300">{m.referralSignups}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
