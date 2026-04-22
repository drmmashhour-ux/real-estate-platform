"use client";

import { useCallback, useEffect, useState } from "react";
import type { ManagementDashboardPayload } from "@/modules/senior-living/dashboard/dashboard.types";
import { AiSuggestionCard, AlertCard, DashboardShell, KpiCard } from "./shared";

export function ManagementRoleHome(props: { base: string }) {
  const [data, setData] = useState<ManagementDashboardPayload | null>(null);

  const load = useCallback(async () => {
    const res = await fetch("/api/dashboard/management", { credentials: "same-origin" });
    if (!res.ok) return;
    setData((await res.json()) as ManagementDashboardPayload);
  }, []);

  useEffect(() => {
    let cancelled = false;
    queueMicrotask(() => {
      if (!cancelled) void load();
    });
    const i = window.setInterval(load, 60_000);
    return () => {
      cancelled = true;
      window.clearInterval(i);
    };
  }, [load]);

  if (!data) {
    return (
      <DashboardShell theme="management" title="Management" subtitle="Portfolio oversight">
        <p className="text-sm text-zinc-500">Loading…</p>
      </DashboardShell>
    );
  }

  return (
    <DashboardShell
      theme="management"
      title={data.groupLabel}
      subtitle="Compare residences and intervene where teams need support."
    >
      {data.alerts.map((a) => (
        <AlertCard key={a.id} severity={a.severity === "warn" ? "warn" : "info"} message={a.message} />
      ))}

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <KpiCard label="Residences" value={data.kpis.totalResidences} />
        <KpiCard label="Leads (week)" value={data.kpis.leadsWeek} />
        <KpiCard label="Visits booked" value={data.kpis.visitsBookedWeek} />
        <KpiCard label="Closes (week)" value={data.kpis.moveInsOrConversionsWeek} />
        <KpiCard
          label="Avg response"
          value={data.kpis.avgResponseTimeHours != null ? `${data.kpis.avgResponseTimeHours} h` : "—"}
        />
      </section>

      <section className="overflow-x-auto rounded-2xl border border-black/10 bg-white shadow-sm">
        <h2 className="border-b border-zinc-100 px-6 py-4 text-sm font-semibold text-zinc-900">Residence comparison</h2>
        <table className="w-full min-w-[880px] text-left text-sm">
          <thead className="border-b border-zinc-100 bg-zinc-50 text-xs uppercase tracking-wide text-zinc-500">
            <tr>
              <th className="px-6 py-3">Residence</th>
              <th className="px-6 py-3">Leads</th>
              <th className="px-6 py-3">Visits</th>
              <th className="px-6 py-3">Conversion</th>
              <th className="px-6 py-3">Occupancy</th>
              <th className="px-6 py-3">Ranking</th>
              <th className="px-6 py-3">Alerts</th>
            </tr>
          </thead>
          <tbody>
            {data.residences.map((r) => (
              <tr key={r.residenceId} className="border-b border-zinc-50">
                <td className="px-6 py-3 font-medium text-zinc-900">
                  {r.name}
                  <span className="mt-0.5 block text-xs font-normal text-zinc-500">{r.city}</span>
                </td>
                <td className="px-6 py-3 tabular-nums">{r.leadsWeek}</td>
                <td className="px-6 py-3 tabular-nums">{r.visitsWeek}</td>
                <td className="px-6 py-3 tabular-nums">
                  {r.conversionRate != null ? `${Math.round(r.conversionRate * 100)}%` : "—"}
                </td>
                <td className="px-6 py-3 tabular-nums">{r.occupancyPct != null ? `${r.occupancyPct}%` : "—"}</td>
                <td className="px-6 py-3 tabular-nums">{r.rankingScore?.toFixed(0) ?? "—"}</td>
                <td className="px-6 py-3 text-xs text-amber-800">{r.alert ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {data.residences.length === 0 ?
          <p className="px-6 py-8 text-center text-sm text-zinc-500">No residences linked yet.</p>
        : null}
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-black/10 bg-white p-6 shadow-sm">
          <h2 className="text-sm font-semibold text-zinc-900">Team signals</h2>
          <ul className="mt-4 space-y-3 text-sm">
            {data.teamPerformance.map((t) => (
              <li key={t.label} className="flex justify-between gap-4">
                <span className="text-zinc-600">{t.label}</span>
                <span className={`font-medium ${t.status === "risk" ? "text-red-700" : t.status === "watch" ? "text-amber-800" : "text-emerald-800"}`}>
                  {t.value}
                </span>
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-2xl border border-black/10 bg-white p-6 shadow-sm">
          <h2 className="text-sm font-semibold text-zinc-900">Demand by residence</h2>
          <ul className="mt-4 space-y-2 text-sm text-zinc-700">
            {data.demand.map((d) => (
              <li key={d.residenceName} className="flex justify-between">
                <span>{d.residenceName}</span>
                <span className="font-medium tabular-nums">{d.newLeadsWeek} leads</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <AiSuggestionCard items={data.aiInsights} />
    </DashboardShell>
  );
}
