"use client";

import { useCallback, useEffect, useState } from "react";
import type { ResidenceDashboardPayload } from "@/modules/senior-living/dashboard/dashboard.types";
import {
  AiSuggestionCard,
  AlertCard,
  DashboardShell,
  EmptyStateCard,
  KpiCard,
  StatusBadge,
} from "./shared";

export function ResidenceRoleHome(props: { base: string; isAdmin: boolean }) {
  const [data, setData] = useState<ResidenceDashboardPayload | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const load = useCallback(async () => {
    setErr(null);
    const u = new URLSearchParams();
    if (typeof window !== "undefined" && props.isAdmin) {
      const p = new URLSearchParams(window.location.search).get("residenceId");
      if (p) u.set("residenceId", p);
    }
    const res = await fetch(`/api/dashboard/residence?${u.toString()}`, { credentials: "same-origin" });
    if (!res.ok) {
      const j = (await res.json().catch(() => ({}))) as { error?: string };
      setErr(j.error ?? "Failed to load");
      return;
    }
    setData((await res.json()) as ResidenceDashboardPayload);
  }, [props.isAdmin]);

  useEffect(() => {
    let cancelled = false;
    queueMicrotask(() => {
      if (!cancelled) void load();
    });
    const i = window.setInterval(() => void load(), 60_000);
    return () => {
      cancelled = true;
      window.clearInterval(i);
    };
  }, [load]);

  if (err && !data) {
    return (
      <DashboardShell theme="residence" title="Residence" subtitle={err}>
        <EmptyStateCard title="Nothing to show yet" body={err} />
      </DashboardShell>
    );
  }

  if (!data) {
    return (
      <DashboardShell theme="residence" title="Residence" subtitle="Loading your workspace…">
        <p className="text-sm text-zinc-500">Loading…</p>
      </DashboardShell>
    );
  }

  const todayHint = `${data.leadQueue.filter((q) => q.needsFollowUp).length} leads need follow-up`;

  return (
    <DashboardShell
      theme="residence"
      title={data.residence.name}
      subtitle={`${data.residence.city} · ${todayHint}`}
      topRight={<StatusBadge verified={data.residence.verified} />}
    >
      {data.alerts.map((a) => (
        <AlertCard key={a.id} severity={a.severity === "warn" ? "warn" : "info"} message={a.message} />
      ))}

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard label="New leads (7d)" value={data.kpis.newLeadsWeek} />
        <KpiCard label="High-priority leads" value={data.kpis.highPriorityLeads} />
        <KpiCard label="Visits booked (7d)" value={data.kpis.visitsBookedWeek} />
        <KpiCard label="Available units" value={`${data.kpis.availableUnits} / ${data.kpis.totalUnits}`} />
      </section>

      <section className="grid gap-8 lg:grid-cols-2">
        <div className="rounded-2xl border border-black/10 bg-white p-6 shadow-sm">
          <h2 className="text-sm font-semibold text-zinc-900">Lead workspace</h2>
          <p className="mt-1 text-xs text-zinc-500">Latest inquiries — prioritize follow-ups.</p>
          <ul className="mt-4 divide-y divide-zinc-100">
            {data.leadQueue.slice(0, 8).map((l) => (
              <li key={l.id} className="flex flex-wrap items-center justify-between gap-2 py-3 text-sm">
                <div>
                  <span className="font-medium text-zinc-900">{l.requesterName}</span>
                  <span className="ml-2 text-xs text-zinc-500">{l.status}</span>
                  {l.needsFollowUp ?
                    <span className="ml-2 rounded bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-900">
                      Follow up
                    </span>
                  : null}
                </div>
                <span className="text-xs font-medium text-zinc-500">{l.band ?? "—"} priority</span>
              </li>
            ))}
          </ul>
          {data.leadQueue.length === 0 ?
            <p className="mt-4 text-sm text-zinc-500">No leads yet — tune your listing to attract families.</p>
          : null}
        </div>

        <div className="space-y-6">
          <div className="rounded-2xl border border-black/10 bg-white p-6 shadow-sm">
            <h2 className="text-sm font-semibold text-zinc-900">Visits</h2>
            <ul className="mt-4 space-y-2 text-sm text-zinc-700">
              {data.visits.upcoming.slice(0, 5).map((v) => (
                <li key={v.id} className="flex justify-between gap-4">
                  <span>Upcoming</span>
                  <span className="text-xs text-zinc-500">{new Date(v.createdAt).toLocaleString()}</span>
                </li>
              ))}
              {data.visits.upcoming.length === 0 ?
                <li className="text-zinc-500">No visit requests in queue.</li>
              : null}
            </ul>
          </div>
          <div className="rounded-2xl border border-black/10 bg-white p-6 shadow-sm">
            <h2 className="text-sm font-semibold text-zinc-900">Availability</h2>
            <p className="mt-3 text-sm text-zinc-600">
              {data.availability.availableUnits} open · {data.availability.occupiedUnits} occupied ·{" "}
              {data.availability.totalUnits} total units tracked
            </p>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-black/10 bg-white p-6 shadow-sm">
        <h2 className="text-sm font-semibold text-zinc-900">Performance</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4 text-sm">
          <div>
            <p className="text-zinc-500">Response time</p>
            <p className="mt-1 font-semibold text-zinc-900">
              {data.performance.responseTimeHours != null ? `${data.performance.responseTimeHours} h` : "—"}
            </p>
          </div>
          <div>
            <p className="text-zinc-500">Conversion</p>
            <p className="mt-1 font-semibold text-zinc-900">
              {data.performance.conversionRate != null ? `${Math.round(data.performance.conversionRate * 100)}%` : "—"}
            </p>
          </div>
          <div>
            <p className="text-zinc-500">Ranking score</p>
            <p className="mt-1 font-semibold text-zinc-900">{data.performance.operatorScore?.toFixed(0) ?? "—"}</p>
          </div>
          <div>
            <p className="text-zinc-500">Profile</p>
            <p className="mt-1 font-semibold text-zinc-900">
              {data.performance.profileCompleteness != null ? `${Math.round(data.performance.profileCompleteness)}%` : "—"}
            </p>
          </div>
        </div>
      </section>

      <AiSuggestionCard items={data.aiSuggestions} />
    </DashboardShell>
  );
}
