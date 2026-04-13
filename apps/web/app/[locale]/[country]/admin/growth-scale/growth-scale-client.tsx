"use client";

import { useEffect, useState } from "react";

type GrowthPayload = {
  window: { now: string; day7: string; day30: string };
  traffic: {
    events7d: number;
    events30d: number;
    pageViews7d: number;
    growthEngagement7d: number;
  };
  leads: { created7d: number; created30d: number; mortgage7d: number };
  revenue: { platformPayments30dCents: number; note: string };
  retargeting: { evaluateFunnelSessionsOpen: number };
};

export function GrowthScaleAdminClient() {
  const [data, setData] = useState<GrowthPayload | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      try {
        const res = await fetch("/api/admin/growth-scale", { credentials: "include" });
        if (!res.ok) {
          setErr("Failed to load");
          return;
        }
        setData((await res.json()) as GrowthPayload);
      } catch {
        setErr("Failed to load");
      }
    })();
  }, []);

  if (err) return <p className="mt-8 text-red-400">{err}</p>;
  if (!data) return <p className="mt-8 text-slate-400">Loading…</p>;

  const rev = (data.revenue.platformPayments30dCents / 100).toFixed(2);

  return (
    <div className="mt-8 grid gap-4 sm:grid-cols-2">
      <section className="rounded-xl border border-slate-800 bg-slate-900/60 p-5">
        <h2 className="font-semibold text-white">Traffic (7d / 30d)</h2>
        <p className="mt-2 text-2xl font-bold text-amber-300">{data.traffic.events7d}</p>
        <p className="text-xs text-slate-500">events last 7 days · {data.traffic.events30d} last 30d</p>
        <p className="mt-3 text-sm text-slate-400">Page views (7d): {data.traffic.pageViews7d}</p>
        <p className="text-sm text-slate-400">Growth CTAs + popups (7d): {data.traffic.growthEngagement7d}</p>
      </section>
      <section className="rounded-xl border border-slate-800 bg-slate-900/60 p-5">
        <h2 className="font-semibold text-white">Leads</h2>
        <p className="mt-2 text-2xl font-bold text-emerald-300">{data.leads.created7d}</p>
        <p className="text-xs text-slate-500">created last 7 days · {data.leads.created30d} last 30d</p>
        <p className="mt-3 text-sm text-slate-400">Mortgage leads (7d): {data.leads.mortgage7d}</p>
      </section>
      <section className="rounded-xl border border-slate-800 bg-slate-900/60 p-5">
        <h2 className="font-semibold text-white">Revenue proxy</h2>
        <p className="mt-2 text-2xl font-bold text-white">${rev}</p>
        <p className="text-xs text-slate-500">Platform payments (30d, paid)</p>
        <p className="mt-2 text-xs text-slate-500">{data.revenue.note}</p>
      </section>
      <section className="rounded-xl border border-slate-800 bg-slate-900/60 p-5">
        <h2 className="font-semibold text-white">Retargeting-ready</h2>
        <p className="mt-2 text-2xl font-bold text-slate-200">{data.retargeting.evaluateFunnelSessionsOpen}</p>
        <p className="text-xs text-slate-500">Evaluate sessions not yet submitted (audience seed)</p>
      </section>
    </div>
  );
}
