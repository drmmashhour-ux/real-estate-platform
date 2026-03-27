"use client";

import { useEffect, useState } from "react";

type AnalyticsPayload = {
  expert: {
    rating: number;
    reviewCount: number;
    totalDeals: number;
    totalRevenue: number;
    currentLeadsToday: number;
    maxLeadsPerDay: number;
  };
  period: {
    leadsAssigned24h: number;
    leadsAssigned7d: number;
    closed7d: number;
    openLeads: number;
    conversionPct: number | null;
  };
  allTime: { dealsRecorded: number; dealVolume: number; platformShare: number };
  subscription: { plan: string; maxLeadsPerDay: number; priorityWeight: number; isActive: boolean } | null;
  credits: { credits: number } | null;
};

export function ExpertAnalyticsClient() {
  const [data, setData] = useState<AnalyticsPayload | null>(null);

  useEffect(() => {
    void fetch("/api/mortgage/expert/analytics", { credentials: "same-origin" })
      .then((r) => (r.ok ? r.json() : null))
      .then(setData);
  }, []);

  if (!data) return <p className="mt-8 text-[#B3B3B3]">Loading…</p>;

  return (
    <div className="mt-8 grid gap-4 sm:grid-cols-2">
      <div className="rounded-2xl border border-white/10 bg-[#121212] p-5">
        <p className="text-xs font-bold uppercase tracking-wider text-[#C9A646]">Profile</p>
        <p className="mt-2 text-sm text-white">Rating ★ {data.expert.rating.toFixed(1)}</p>
        <p className="text-sm text-[#B3B3B3]">{data.expert.reviewCount} reviews</p>
        <p className="mt-2 text-sm text-white">{data.expert.totalDeals} deals closed</p>
        <p className="text-sm text-[#B3B3B3]">${data.expert.totalRevenue.toLocaleString()} revenue (reported)</p>
      </div>
      <div className="rounded-2xl border border-white/10 bg-[#121212] p-5">
        <p className="text-xs font-bold uppercase tracking-wider text-[#C9A646]">Lead caps</p>
        <p className="mt-2 text-sm text-white">
          Today: {data.expert.currentLeadsToday} / {data.expert.maxLeadsPerDay}
        </p>
        <p className="text-sm text-[#B3B3B3]">
          Plan: {data.subscription?.plan ?? "default"} (effective cap from subscription when active)
        </p>
        {data.credits ? (
          <p className="mt-2 text-sm text-amber-200">Pay-per-lead credits: {data.credits.credits}</p>
        ) : (
          <p className="mt-2 text-sm text-[#737373]">Pay-per-lead credits not enabled for your account.</p>
        )}
      </div>
      <div className="rounded-2xl border border-white/10 bg-[#121212] p-5 sm:col-span-2">
        <p className="text-xs font-bold uppercase tracking-wider text-[#C9A646]">Pipeline</p>
        <div className="mt-3 grid gap-2 text-sm sm:grid-cols-3">
          <p className="text-[#B3B3B3]">
            Leads 24h: <span className="font-semibold text-white">{data.period.leadsAssigned24h}</span>
          </p>
          <p className="text-[#B3B3B3]">
            Leads 7d: <span className="font-semibold text-white">{data.period.leadsAssigned7d}</span>
          </p>
          <p className="text-[#B3B3B3]">
            Closed 7d: <span className="font-semibold text-white">{data.period.closed7d}</span>
          </p>
          <p className="text-[#B3B3B3]">
            Open: <span className="font-semibold text-white">{data.period.openLeads}</span>
          </p>
          <p className="text-[#B3B3B3]">
            Conversion 7d:{" "}
            <span className="font-semibold text-white">
              {data.period.conversionPct != null ? `${data.period.conversionPct}%` : "—"}
            </span>
          </p>
        </div>
      </div>
    </div>
  );
}
