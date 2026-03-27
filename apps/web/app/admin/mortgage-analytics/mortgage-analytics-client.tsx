"use client";

import { useEffect, useState } from "react";

type Payload = {
  mortgageLeadsToday: number;
  mortgageLeads7d: number;
  closedMortgage7d: number;
  conversionRate7dPct: number;
  marketplaceOpenCount: number;
  revenue7d: { platformShare: number; dealAmount: number };
  topExperts: Array<{
    id: string;
    name: string;
    email: string;
    rating: number;
    totalDeals: number;
    totalRevenue: number;
    distributionScore: number;
  }>;
};

export function MortgageAnalyticsAdminClient() {
  const [data, setData] = useState<Payload | null>(null);

  useEffect(() => {
    void fetch("/api/admin/mortgage-analytics", { credentials: "same-origin" })
      .then((r) => (r.ok ? r.json() : null))
      .then(setData);
  }, []);

  if (!data) return <p className="mt-8 text-slate-400">Loading…</p>;

  return (
    <div className="mt-8 space-y-8">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-4">
          <p className="text-xs text-slate-500">Mortgage leads today</p>
          <p className="mt-1 text-2xl font-bold text-white">{data.mortgageLeadsToday}</p>
        </div>
        <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-4">
          <p className="text-xs text-slate-500">Leads (7d)</p>
          <p className="mt-1 text-2xl font-bold text-white">{data.mortgageLeads7d}</p>
        </div>
        <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-4">
          <p className="text-xs text-slate-500">Closed (7d)</p>
          <p className="mt-1 text-2xl font-bold text-emerald-300">{data.closedMortgage7d}</p>
        </div>
        <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-4">
          <p className="text-xs text-slate-500">Conversion 7d</p>
          <p className="mt-1 text-2xl font-bold text-amber-200">{data.conversionRate7dPct}%</p>
        </div>
      </div>
      <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-4">
        <p className="text-xs font-semibold uppercase tracking-wider text-amber-200/80">Marketplace</p>
        <p className="mt-1 text-lg text-white">{data.marketplaceOpenCount} open pool leads</p>
      </div>
      <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-4">
        <p className="text-xs font-semibold uppercase tracking-wider text-amber-200/80">Revenue (7d)</p>
        <p className="mt-1 text-white">
          Platform share: <strong>${data.revenue7d.platformShare.toLocaleString()}</strong>
        </p>
        <p className="text-slate-400">Reported deal volume: ${data.revenue7d.dealAmount.toLocaleString()}</p>
      </div>
      <div>
        <h2 className="text-lg font-bold text-white">Top experts (routing score)</h2>
        <ul className="mt-4 divide-y divide-slate-800 rounded-xl border border-slate-800">
          {data.topExperts.map((e, i) => (
            <li key={e.id} className="flex flex-wrap items-center justify-between gap-2 px-4 py-3">
              <span className="text-slate-400">{i + 1}.</span>
              <span className="flex-1 font-medium text-white">{e.name}</span>
              <span className="text-xs text-slate-500">{e.email}</span>
              <span className="text-xs text-amber-200">★ {e.rating.toFixed(1)}</span>
              <span className="text-xs text-slate-400">{e.totalDeals} deals</span>
              <span className="text-xs text-slate-500">score {e.distributionScore.toFixed(2)}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
