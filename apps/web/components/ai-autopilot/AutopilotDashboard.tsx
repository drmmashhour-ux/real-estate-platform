"use client";

import * as React from "react";
import { AutopilotModeCard } from "./AutopilotModeCard";
import { AutopilotQueue } from "./AutopilotQueue";
import { AutopilotDomainSummary } from "./AutopilotDomainSummary";
import type { AutopilotActionSort } from "@/modules/ai-autopilot";

type Summary = {
  total: number;
  totalActiveActions?: number;
  pendingApproval: number;
  byStatus: Record<string, number>;
  duplicateCollapsedCount?: number;
  staleActions?: number;
  topQualityActions?: Array<{
    id: string;
    title: string;
    qualityScore: number | null;
    priorityBucket: string | null;
    duplicateCount: number;
  }>;
};

type ActionRow = {
  id: string;
  title: string;
  domain: string;
  riskLevel: string;
  status: string;
  summary: string;
  reasons: unknown;
  qualityScore?: number | null;
  priorityBucket?: string | null;
  duplicateCount?: number;
  lastRefreshedAt?: string | null;
  updatedAt?: string;
};

export function AutopilotDashboard() {
  const [summary, setSummary] = React.useState<Summary | null>(null);
  const [actions, setActions] = React.useState<ActionRow[]>([]);
  const [sort, setSort] = React.useState<AutopilotActionSort>("quality");
  const [err, setErr] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(true);

  const load = React.useCallback(() => {
    setLoading(true);
    const sp = new URLSearchParams({ sort });
    void Promise.all([fetch("/api/autopilot/summary"), fetch(`/api/autopilot/actions?${sp.toString()}`)])
      .then(async ([s, a]) => {
        const sj = (await s.json()) as Summary & { error?: string };
        const aj = (await a.json()) as { actions?: ActionRow[]; error?: string };
        if (!s.ok) throw new Error(sj.error ?? "summary failed");
        if (!a.ok) throw new Error(aj.error ?? "actions failed");
        setSummary(sj);
        setActions(aj.actions ?? []);
      })
      .catch((e: Error) => setErr(e.message))
      .finally(() => setLoading(false));
  }, [sort]);

  React.useEffect(() => {
    load();
  }, [load]);

  const staleStatuses = React.useMemo(() => new Set(["archived", "expired"]), []);
  const activeQueue = React.useMemo(
    () => actions.filter((x) => !staleStatuses.has(x.status)),
    [actions, staleStatuses],
  );
  const staleQueue = React.useMemo(
    () => actions.filter((x) => staleStatuses.has(x.status)),
    [actions, staleStatuses],
  );

  if (err) {
    return <p className="text-sm text-red-400">{err}</p>;
  }
  if (loading || !summary) {
    return <p className="text-sm text-zinc-500">Loading AI Autopilot…</p>;
  }

  return (
    <div className="space-y-8">
      <AutopilotModeCard />
      <div className="grid gap-4 md:grid-cols-4">
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4">
          <p className="text-xs uppercase tracking-wider text-zinc-500">Queue depth</p>
          <p className="mt-1 text-2xl font-semibold text-white">{summary.total}</p>
        </div>
        {typeof summary.totalActiveActions === "number" && (
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4">
            <p className="text-xs uppercase tracking-wider text-zinc-500">Active (non-terminal)</p>
            <p className="mt-1 text-2xl font-semibold text-white">{summary.totalActiveActions}</p>
          </div>
        )}
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4">
          <p className="text-xs uppercase tracking-wider text-zinc-500">Needs attention</p>
          <p className="mt-1 text-2xl font-semibold text-amber-200">{summary.pendingApproval}</p>
        </div>
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4">
          <p className="text-xs uppercase tracking-wider text-zinc-500">By status</p>
          <ul className="mt-2 max-h-28 overflow-y-auto text-xs text-zinc-400">
            {Object.entries(summary.byStatus).map(([k, v]) => (
              <li key={k}>
                {k}: {v}
              </li>
            ))}
          </ul>
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {typeof summary.duplicateCollapsedCount === "number" && (
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4">
            <p className="text-xs uppercase tracking-wider text-zinc-500">Duplicate detections collapsed</p>
            <p className="mt-1 text-2xl font-semibold text-sky-200">{summary.duplicateCollapsedCount}</p>
            <p className="mt-1 text-xs text-zinc-500">Sum of refresh counters — same fingerprint merged into one row.</p>
          </div>
        )}
        {typeof summary.staleActions === "number" && summary.staleActions > 0 && (
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4">
            <p className="text-xs uppercase tracking-wider text-zinc-500">Archived / expired (stale)</p>
            <p className="mt-1 text-2xl font-semibold text-zinc-300">{summary.staleActions}</p>
          </div>
        )}
      </div>
      {summary.topQualityActions && summary.topQualityActions.length > 0 && (
        <div className="rounded-xl border border-emerald-900/40 bg-emerald-950/20 p-4">
          <p className="text-xs uppercase tracking-wider text-emerald-400/90">Top quality (snapshot)</p>
          <ul className="mt-2 space-y-1 text-sm text-zinc-300">
            {summary.topQualityActions.map((t) => (
              <li key={t.id}>
                <span className="font-mono text-emerald-300/90">{t.qualityScore ?? "—"}</span> · {t.title}
              </li>
            ))}
          </ul>
        </div>
      )}
      <AutopilotDomainSummary actions={actions} />
      <AutopilotQueue
        actions={activeQueue}
        staleActions={staleQueue}
        sort={sort}
        onSortChange={setSort}
        onRefresh={load}
      />
    </div>
  );
}
