"use client";

import { useCallback, useEffect, useState } from "react";

type Bm = Awaited<ReturnType<typeof import("@/modules/strategy-benchmark/deal-strategy-insights.service").getDealStrategyBenchmarkView>>;

type Props = { dealId: string; enabled?: boolean };

export function DealStrategyBenchmarkPanel({ dealId, enabled = true }: Props) {
  const [row, setRow] = useState<Bm | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!enabled || !dealId) return;
    setErr(null);
    try {
      const res = await fetch(`/api/deals/${encodeURIComponent(dealId)}/strategy-benchmark`, { credentials: "same-origin" });
      const j = (await res.json()) as { ok?: boolean; benchmark?: Bm };
      if (j.ok && j.benchmark) setRow(j.benchmark);
      else setErr("Unavailable");
    } catch {
      setErr("Unavailable");
    }
  }, [dealId, enabled]);

  useEffect(() => {
    void load();
  }, [load]);

  if (!enabled) return null;
  if (err || !row) {
    return (
      <div className="mt-2 rounded border border-slate-800/80 p-2 text-sm text-slate-500">
        {err ?? "Loading…"}
      </div>
    );
  }
  return (
    <div className="mt-2 space-y-2 rounded border border-slate-800/80 p-3 text-sm text-slate-400">
      <h3 className="text-slate-200">Strategy signals on this deal</h3>
      {row.notes.length ? (
        <ul className="list-inside list-disc text-xs text-slate-500">
          {row.notes.map((n) => (
            <li key={n.slice(0, 32)}>{n}</li>
          ))}
        </ul>
      ) : null}
      <p className="text-xs text-slate-500">Strategies with logged use (anonymized counts)</p>
      {row.executions.length === 0 ? (
        <p className="text-xs">No strategy executions linked yet — confirm a path in negotiation sim to log.</p>
      ) : (
        <ul className="space-y-1 text-xs">
          {row.executions.map((e) => (
            <li key={e.id} className="text-slate-500">
              <span className="text-amber-200/80">{e.strategyKey}</span> <span className="text-slate-600">({e.domain})</span>
            </li>
          ))}
        </ul>
      )}
      {row.outcome ? (
        <p className="text-xs text-slate-500">
          Outcome bucket: {row.outcome.outcome} · time span ≈{row.outcome.closingTimeDays != null ? row.outcome.closingTimeDays.toFixed(0) : "n/a"} d
        </p>
      ) : null}
      {row.attributed.length > 0 ? (
        <div>
          <p className="text-xs text-slate-500">Attribution (heuristic weights, not blame)</p>
          <ul className="list-inside list-disc text-xs text-slate-500">
            {row.attributed.map((a) => (
              <li key={a.strategyKey}>
                {a.strategyKey}: {a.contributionWeight.toFixed(3)}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
      <button type="button" onClick={load} className="text-xs text-amber-400/90 hover:text-amber-300">
        Refresh
      </button>
    </div>
  );
}
