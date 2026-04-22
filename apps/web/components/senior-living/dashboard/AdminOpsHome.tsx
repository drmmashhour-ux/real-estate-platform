"use client";

import { useCallback, useEffect, useState } from "react";
import type { AdminDashboardPayload } from "@/modules/senior-living/dashboard/dashboard.types";
import { AlertCard, DashboardShell, KpiCard } from "./shared";

/** Platform mission control — no candlesticks, no ticker noise. */
export function AdminOpsHome(props: { base: string }) {
  const [data, setData] = useState<AdminDashboardPayload | null>(null);

  const load = useCallback(async () => {
    const res = await fetch("/api/dashboard/admin", { credentials: "same-origin" });
    if (!res.ok) return;
    setData((await res.json()) as AdminDashboardPayload);
  }, []);

  useEffect(() => {
    let cancelled = false;
    queueMicrotask(() => {
      if (!cancelled) void load();
    });
    const i = window.setInterval(load, 45_000);
    return () => {
      cancelled = true;
      window.clearInterval(i);
    };
  }, [load]);

  if (!data) {
    return (
      <DashboardShell theme="admin" title="Platform operations" subtitle="Marketplace health, queues, and approvals.">
        <p className="text-sm text-zinc-400">Loading command center…</p>
      </DashboardShell>
    );
  }

  return (
    <DashboardShell
      theme="admin"
      title="Platform operations"
      subtitle={`Status: ${data.kpis.responseSlaOk ? "SLA healthy" : "Review response times"} · ${data.kpis.activeCities} expansion cities tracked`}
    >
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => void load()}
          className="rounded-lg border border-zinc-600 px-4 py-2 text-sm text-zinc-100 hover:bg-zinc-900"
        >
          Refresh
        </button>
      </div>

      {data.alerts.slice(0, 4).map((a) => (
        <AlertCard
          key={a.id}
          severity={a.severity === "urgent" ? "urgent" : a.severity === "warn" ? "warn" : "info"}
          message={a.message}
        />
      ))}

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <KpiCard variant="dark" label="Leads today" value={data.kpis.leadsToday} />
        <KpiCard
          variant="dark"
          label="High-quality ratio"
          value={data.kpis.highQualityLeadRatio != null ? `${data.kpis.highQualityLeadRatio}%` : "—"}
        />
        <KpiCard variant="dark" label="Active operators" value={data.kpis.activeOperators} />
        <KpiCard variant="dark" label="Revenue today (CAD est.)" value={data.kpis.revenueTodayCad?.toFixed(0) ?? "—"} />
        <KpiCard variant="dark" label="Monthly revenue (CAD est.)" value={data.kpis.revenueMonthCad?.toFixed(0) ?? "—"} />
        <KpiCard variant="dark" label="Active cities (expansion)" value={data.kpis.activeCities} />
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-6">
          <h2 className="text-sm font-semibold text-zinc-100">Marketplace health</h2>
          <ul className="mt-4 space-y-2 text-sm text-zinc-300">
            <li className="flex justify-between gap-4">
              <span className="text-zinc-500">Supply / demand index</span>
              <span className="font-medium tabular-nums text-zinc-100">
                {data.marketplaceHealth.supplyDemandIndex?.toFixed(2) ?? "—"}
              </span>
            </li>
            <li className="flex justify-between gap-4">
              <span className="text-zinc-500">Avg response</span>
              <span className="font-medium">
                {data.marketplaceHealth.avgResponseHours != null ? `${data.marketplaceHealth.avgResponseHours} h` : "—"}
              </span>
            </li>
          </ul>
          <div className="mt-6">
            <p className="text-xs uppercase tracking-wide text-zinc-500">Lead quality (30d)</p>
            <ul className="mt-2 space-y-1 text-sm text-zinc-400">
              {data.marketplaceHealth.leadQualityBuckets.map((b) => (
                <li key={b.label} className="flex justify-between">
                  <span>{b.label}</span>
                  <span>{b.count}</span>
                </li>
              ))}
              {data.marketplaceHealth.leadQualityBuckets.length === 0 ?
                <li className="text-zinc-600">No scored rows in window.</li>
              : null}
            </ul>
          </div>
        </div>

        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-6">
          <h2 className="text-sm font-semibold text-zinc-100">Conversion funnel (30d)</h2>
          <div className="mt-4 grid grid-cols-3 gap-4 text-center text-sm">
            <div className="rounded-xl border border-zinc-700 p-4">
              <p className="text-2xl font-semibold text-white">{data.marketplaceHealth.conversionFunnel.new}</p>
              <p className="mt-1 text-xs text-zinc-500">New</p>
            </div>
            <div className="rounded-xl border border-zinc-700 p-4">
              <p className="text-2xl font-semibold text-white">{data.marketplaceHealth.conversionFunnel.contacted}</p>
              <p className="mt-1 text-xs text-zinc-500">Contacted</p>
            </div>
            <div className="rounded-xl border border-zinc-700 p-4">
              <p className="text-2xl font-semibold text-white">{data.marketplaceHealth.conversionFunnel.closed}</p>
              <p className="mt-1 text-xs text-zinc-500">Closed</p>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-6">
          <h2 className="text-sm font-semibold text-amber-200/90">Hot leads</h2>
          <ul className="mt-4 space-y-3 text-sm">
            {data.hotLeads.map((h) => (
              <li key={h.id} className="flex flex-wrap justify-between gap-2 border-b border-zinc-800 pb-3 last:border-0">
                <div>
                  <p className="font-medium text-zinc-100">{h.requesterName}</p>
                  <p className="text-xs text-zinc-500">
                    {h.residenceName} · {h.city}
                  </p>
                </div>
                <span className="text-xs font-medium text-amber-400">{h.band ?? "—"}</span>
              </li>
            ))}
            {data.hotLeads.length === 0 ?
              <li className="text-zinc-500">No scored hot leads right now.</li>
            : null}
          </ul>
        </div>

        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-6">
          <h2 className="text-sm font-semibold text-rose-200/90">Needs attention</h2>
          <ul className="mt-4 space-y-3 text-sm text-zinc-300">
            {data.stuckCases.map((s) => (
              <li key={s.leadId}>
                <p className="font-medium text-zinc-100">{s.residenceName}</p>
                <p className="text-xs text-zinc-500">{s.issue}</p>
              </li>
            ))}
            {data.stuckCases.length === 0 ?
              <li className="text-zinc-500">No stuck cases flagged.</li>
            : null}
          </ul>
        </div>
      </section>

      <section className="overflow-x-auto rounded-2xl border border-zinc-800">
        <h2 className="border-b border-zinc-800 bg-zinc-900/80 px-6 py-4 text-sm font-semibold text-zinc-100">
          City signals
        </h2>
        <table className="w-full min-w-[640px] text-left text-sm text-zinc-300">
          <thead className="border-b border-zinc-800 text-xs uppercase text-zinc-500">
            <tr>
              <th className="px-6 py-3">City</th>
              <th className="px-6 py-3">Leads</th>
              <th className="px-6 py-3">Note</th>
            </tr>
          </thead>
          <tbody>
            {data.cities.map((c) => (
              <tr key={c.city} className="border-b border-zinc-900">
                <td className="px-6 py-3 text-zinc-100">{c.city}</td>
                <td className="px-6 py-3 tabular-nums">{c.leads}</td>
                <td className="px-6 py-3 text-xs">{c.note}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-6">
        <h2 className="text-sm font-semibold text-zinc-100">Operator quality</h2>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[560px] text-sm">
            <thead className="text-left text-xs text-zinc-500">
              <tr>
                <th className="py-2 pr-4">Operator</th>
                <th className="py-2 pr-4">Residences</th>
                <th className="py-2 pr-4">Score</th>
                <th className="py-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {data.operators.map((o) => (
                <tr key={o.operatorId} className="border-t border-zinc-800">
                  <td className="py-3 text-zinc-100">{o.name}</td>
                  <td className="py-3 tabular-nums">{o.residences}</td>
                  <td className="py-3 tabular-nums">{o.score?.toFixed(1) ?? "—"}</td>
                  <td className="py-3 text-xs capitalize text-amber-400">{o.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-6">
          <h2 className="text-sm font-semibold text-zinc-100">Approval queue</h2>
          <ul className="mt-4 space-y-3 text-sm text-zinc-400">
            {data.approvals.map((p) => (
              <li key={p.id} className="rounded-lg border border-zinc-700 px-4 py-3">
                <p className="font-medium text-zinc-200">{p.kind}</p>
                <p className="mt-1 text-xs">{p.title}</p>
                <p className="mt-2 text-[10px] uppercase text-zinc-600">{p.status}</p>
              </li>
            ))}
            {data.approvals.length === 0 ?
              <li className="text-zinc-600">No pending autonomy approvals.</li>
            : null}
          </ul>
        </div>
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-6">
          <h2 className="text-sm font-semibold text-zinc-100">Live activity</h2>
          <ul className="mt-4 max-h-72 space-y-2 overflow-y-auto text-xs text-zinc-400">
            {data.activityFeed.map((a, i) => (
              <li key={`${a.at}-${i}`} className="flex gap-3 border-b border-zinc-900 pb-2">
                <span className="shrink-0 text-zinc-600">{new Date(a.at).toLocaleString()}</span>
                <span>{a.label}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="rounded-2xl border border-amber-500/25 bg-amber-500/[0.07] p-6">
        <h2 className="text-sm font-semibold text-amber-200">Next actions</h2>
        <ul className="mt-4 space-y-3 text-sm text-zinc-200">
          {data.aiActions.map((t) => (
            <li key={t.slice(0, 48)} className="flex gap-2">
              <span className="text-amber-400">→</span>
              <span>{t}</span>
            </li>
          ))}
          {data.aiActions.length === 0 ?
            <li className="text-zinc-500">Platform steady — monitor leads and SLA.</li>
          : null}
        </ul>
      </section>
    </DashboardShell>
  );
}
