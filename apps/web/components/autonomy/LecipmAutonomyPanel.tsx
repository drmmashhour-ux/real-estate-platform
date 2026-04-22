"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

type DecisionRow = {
  id: string;
  domain: string;
  action: string;
  rationale: string;
  confidence: number;
  impactEstimate: number | null;
  requiresApproval: boolean;
  status: string;
  payloadJson: unknown;
  baselineMetricsJson: unknown;
  outcomeMetricsJson: unknown;
  appliedAt: string | null;
  rolledBackAt: string | null;
  createdAt: string;
  _count: { logs: number };
};

function baselineOutcomeDelta(row: DecisionRow): string | null {
  const b = row.baselineMetricsJson as { seniorConversionRate30d?: number } | null;
  const o = row.outcomeMetricsJson as { seniorConversionRate30d?: number } | null;
  if (
    b?.seniorConversionRate30d == null ||
    o?.seniorConversionRate30d == null ||
    row.status === "PROPOSED"
  ) {
    return null;
  }
  const delta = (o.seniorConversionRate30d - b.seniorConversionRate30d) * 100;
  const sign = delta >= 0 ? "+" : "";
  return `${sign}${delta.toFixed(2)} pp conversion (snapshot)`;
}

export function LecipmAutonomyPanel() {
  const [items, setItems] = useState<DecisionRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/autonomy/lecipm/decisions", { credentials: "same-origin" });
      const j = (await res.json()) as { ok?: boolean; items?: DecisionRow[] };
      if (j.items) setItems(j.items);
      if (!j.ok) setError("load_failed");
    } catch {
      setError("load_failed");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const appliedCount = useMemo(() => items.filter((i) => i.status === "APPLIED" || i.status === "AUTO_APPLIED").length, [items]);

  async function postAction(id: string, action: "approve" | "reject" | "apply" | "rollback") {
    setBusyId(id);
    setError(null);
    try {
      const res = await fetch(`/api/autonomy/lecipm/decisions/${id}`, {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const j = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok || !j.ok) setError(j.error ?? "action_failed");
      await load();
    } finally {
      setBusyId(null);
    }
  }

  return (
    <section className="space-y-4 rounded-xl border border-emerald-500/20 bg-emerald-950/20 p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-emerald-100">LECIPM optimization loop</h3>
          <p className="mt-1 text-xs text-slate-400">
            Daily cron proposes decisions; changes under 5% can auto-apply. Pricing/ranking/growth above threshold need
            approval. Full audit trail on each row.
          </p>
        </div>
        <button
          type="button"
          disabled={loading}
          onClick={() => void load()}
          className="rounded-lg border border-emerald-500/40 px-3 py-1.5 text-xs font-semibold text-emerald-100 hover:bg-emerald-950/40 disabled:opacity-40"
        >
          Refresh
        </button>
      </div>

      <div className="flex flex-wrap gap-4 text-xs text-slate-400">
        <span>
          Applied (all time): <strong className="text-slate-200">{appliedCount}</strong>
        </span>
        <span>
          Success proxy: compare baseline vs outcome conversion on applied rows (7d snapshot at apply time).
        </span>
      </div>

      {error ? <p className="text-xs text-rose-400">{error}</p> : null}

      <div className="overflow-x-auto">
        <table className="w-full min-w-[720px] border-collapse text-left text-xs text-slate-300">
          <thead>
            <tr className="border-b border-white/10 text-[10px] uppercase tracking-wide text-slate-500">
              <th className="py-2 pr-2">When</th>
              <th className="py-2 pr-2">Domain</th>
              <th className="py-2 pr-2">Action</th>
              <th className="py-2 pr-2">Status</th>
              <th className="py-2 pr-2">Guard</th>
              <th className="py-2 pr-2">Impact</th>
              <th className="py-2 pr-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.map((row) => {
              const deltaLabel = baselineOutcomeDelta(row);
              return (
                <tr key={row.id} className="border-b border-white/5 align-top">
                  <td className="py-2 pr-2 text-slate-500">
                    {new Date(row.createdAt).toLocaleString()}
                  </td>
                  <td className="py-2 pr-2 font-medium text-slate-200">{row.domain}</td>
                  <td className="py-2 pr-2 max-w-[220px]">
                    <span className="text-slate-100">{row.action}</span>
                    <p className="mt-1 text-[11px] leading-snug text-slate-500">{row.rationale}</p>
                  </td>
                  <td className="py-2 pr-2">
                    <span className="rounded bg-white/5 px-1.5 py-0.5 text-[10px] text-slate-300">{row.status}</span>
                  </td>
                  <td className="py-2 pr-2">{row.requiresApproval ? "Approval" : "Auto OK"}</td>
                  <td className="py-2 pr-2 text-slate-400">
                    {deltaLabel ?? "—"}
                    <span className="ml-2 text-[10px] text-slate-600">logs:{row._count.logs}</span>
                  </td>
                  <td className="py-2 pr-2">
                    <div className="flex flex-wrap gap-1">
                      {row.status === "PROPOSED" && row.requiresApproval ? (
                        <>
                          <button
                            type="button"
                            disabled={busyId === row.id}
                            className="rounded bg-emerald-600/80 px-2 py-1 text-[10px] font-semibold text-white hover:bg-emerald-500 disabled:opacity-40"
                            onClick={() => void postAction(row.id, "approve")}
                          >
                            Approve
                          </button>
                          <button
                            type="button"
                            disabled={busyId === row.id}
                            className="rounded border border-white/15 px-2 py-1 text-[10px] text-slate-300 hover:bg-white/5 disabled:opacity-40"
                            onClick={() => void postAction(row.id, "reject")}
                          >
                            Reject
                          </button>
                        </>
                      ) : null}
                      {row.status === "APPROVED" ? (
                        <button
                          type="button"
                          disabled={busyId === row.id}
                          className="rounded bg-amber-600/80 px-2 py-1 text-[10px] font-semibold text-white hover:bg-amber-500 disabled:opacity-40"
                          onClick={() => void postAction(row.id, "apply")}
                        >
                          Apply
                        </button>
                      ) : null}
                      {(row.status === "APPLIED" || row.status === "AUTO_APPLIED") && !row.rolledBackAt ? (
                        <button
                          type="button"
                          disabled={busyId === row.id}
                          className="rounded border border-rose-500/40 px-2 py-1 text-[10px] text-rose-200 hover:bg-rose-950/40 disabled:opacity-40"
                          onClick={() => void postAction(row.id, "rollback")}
                        >
                          Rollback
                        </button>
                      ) : null}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {items.length === 0 && !loading ? (
          <p className="py-6 text-center text-xs text-slate-500">No optimization decisions yet — run the daily cron or seed traffic.</p>
        ) : null}
      </div>
    </section>
  );
}
