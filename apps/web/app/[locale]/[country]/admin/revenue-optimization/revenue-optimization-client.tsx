"use client";

import { useEffect, useState } from "react";

type Payload = {
  windowDays: number;
  mortgageLeads30: number;
  closed30: number;
  conversionRatePct: number;
  revenuePerLeadDollars: number;
  platformShare30: number;
  dealVolume30: number;
  tiers: Array<{ tier: string; count: number }>;
  abVariants: Array<{ variant: string; leads: number }>;
  topRegions: Array<{ region: string; leads: number }>;
  topExperts: Array<{
    expertId: string;
    name: string;
    email: string;
    deals: number;
    platformShare: number;
    dealVolume: number;
    rating: number;
    totalDeals: number;
  }>;
};

export function RevenueOptimizationAdminClient() {
  const [data, setData] = useState<Payload | null>(null);

  useEffect(() => {
    void fetch("/api/admin/revenue-optimization", { credentials: "same-origin" })
      .then((r) => (r.ok ? r.json() : null))
      .then(setData);
  }, []);

  if (!data) return <p className="mt-8 text-slate-400">Loading…</p>;

  return (
    <div className="mt-8 space-y-10">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-4">
          <p className="text-xs text-slate-500">Mortgage leads ({data.windowDays}d)</p>
          <p className="mt-1 text-2xl font-bold text-white">{data.mortgageLeads30}</p>
        </div>
        <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-4">
          <p className="text-xs text-slate-500">Closed ({data.windowDays}d)</p>
          <p className="mt-1 text-2xl font-bold text-white">{data.closed30}</p>
        </div>
        <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-4">
          <p className="text-xs text-slate-500">Conversion rate</p>
          <p className="mt-1 text-2xl font-bold text-emerald-300">{data.conversionRatePct}%</p>
        </div>
        <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-4">
          <p className="text-xs text-slate-500">Platform $ / lead</p>
          <p className="mt-1 text-2xl font-bold text-amber-300">${data.revenuePerLeadDollars.toLocaleString()}</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-5">
          <h2 className="text-sm font-bold text-white">Revenue tiers</h2>
          <ul className="mt-3 space-y-2 text-sm text-slate-300">
            {data.tiers.map((t) => (
              <li key={t.tier} className="flex justify-between">
                <span>{t.tier}</span>
                <span className="font-mono text-amber-200">{t.count}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-5">
          <h2 className="text-sm font-bold text-white">A/B variants (mortgage CTA)</h2>
          <ul className="mt-3 space-y-2 text-sm text-slate-300">
            {data.abVariants.map((a) => (
              <li key={a.variant} className="flex justify-between">
                <span>{a.variant}</span>
                <span className="font-mono text-amber-200">{a.leads}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-5">
        <h2 className="text-sm font-bold text-white">Top cities / regions</h2>
        <ul className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3 text-sm text-slate-300">
          {data.topRegions.map((c) => (
            <li key={c.region} className="flex justify-between rounded-lg border border-white/5 px-3 py-2">
              <span>{c.region}</span>
              <span className="font-mono text-amber-200">{c.leads}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-5">
        <h2 className="text-sm font-bold text-white">Top experts by platform share ({data.windowDays}d)</h2>
        <ul className="mt-3 space-y-2 text-sm">
          {data.topExperts.map((e) => (
            <li
              key={e.expertId}
              className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-white/5 px-3 py-2 text-slate-300"
            >
              <span className="font-medium text-white">
                {e.name}{" "}
                <span className="text-xs text-slate-500">
                  ({e.totalDeals} deals · {e.rating.toFixed(1)}★)
                </span>
              </span>
              <span className="font-mono text-emerald-300">${e.platformShare.toLocaleString()} platform</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
