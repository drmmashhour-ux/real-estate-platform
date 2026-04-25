"use client";

import { useCallback, useEffect, useState } from "react";

type Benchmark = {
  executions: { id: string; strategyKey: string; domain: string; createdAt: string }[];
  outcome: { outcome: "WON" | "LOST" | "STALLED"; closingTimeDays: number | null } | null;
  attributed: { strategyKey: string; domain: string; contributionWeight: number }[];
  notes: string[];
};

type Props = { dealId: string; enabled?: boolean };

/**
 * Product-level strategy logging (aggregate learning). Not personal profiling; not a guarantee of cause.
 */
export function DealStrategyBenchmarkPanel({ dealId, enabled = true }: Props) {
  const [b, setB] = useState<Benchmark | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!enabled || !dealId) return;
    setLoading(true);
    setErr(null);
    try {
      const res = await fetch(`/api/deals/${encodeURIComponent(dealId)}/strategy-benchmark`, { credentials: "same-origin" });
      const j = (await res.json()) as { ok?: boolean; benchmark?: Benchmark; error?: string };
      if (j.ok && j.benchmark) setB(j.benchmark);
      else setErr(j.error ?? "Could not load");
    } catch {
      setErr("Could not load");
    } finally {
      setLoading(false);
    }
  }, [dealId, enabled]);

  useEffect(() => {
    void load();
  }, [load]);

  if (!enabled) return null;
  if (loading) {
    return (
      <section className="rounded-lg border border-slate-800 bg-slate-900/60 p-4">
        <h2 className="text-lg font-medium text-slate-200">Strategy benchmark (this deal)</h2>
        <p className="mt-2 text-sm text-slate-500">Loading…</p>
      </section>
    );
  }
  if (err || !b) {
    return (
      <section className="rounded-lg border border-slate-800 bg-slate-900/60 p-4">
        <h2 className="text-lg font-medium text-slate-200">Strategy benchmark (this deal)</h2>
        <p className="mt-2 text-sm text-rose-300">{err ?? "—"}</p>
        <button type="button" onClick={load} className="mt-2 text-xs text-amber-400">
          Retry
        </button>
      </section>
    );
  }

  const whatWorked = (() => {
    if (!b.outcome) return "No terminal bucket recorded yet (WON / LOST / STALLED) — benchmarks update when a deal is bucketed, not a prediction in advance.";
    if (b.outcome.outcome === "WON")
      return "This deal is in the WON bucket for aggregates. Credited strategy keys below received fractional weight toward win-rate heuristics — not proof they caused the outcome.";
    if (b.outcome.outcome === "LOST")
      return "This deal is in the LOST bucket. Strategies still receive soft learning credit in proportion to attributed weight; use as one signal among many.";
    return "This deal is in the STALLED bucket (no close). Strategies may still have been part of the journey — use nuance, not blame.";
  })();

  return (
    <section className="rounded-lg border border-slate-800 bg-slate-900/60 p-4">
      <h2 className="text-lg font-medium text-slate-200">Strategy benchmark (this deal)</h2>
      <p className="mt-1 text-xs text-slate-500">
        Probabilistic, product-level only — not legal or financial advice; avoid inferring personal traits; no deterministic claims.
      </p>

      <h3 className="mt-3 text-sm font-medium text-slate-300">Strategies used (logged events)</h3>
      {b.executions.length === 0 ? (
        <p className="mt-1 text-sm text-slate-500">No strategy execution events for this deal yet (e.g. confirm a suggestion or simulator path).</p>
      ) : (
        <ul className="mt-1 list-inside list-disc text-xs text-slate-400">
          {b.executions.map((e) => (
            <li key={e.id}>
              <span className="text-amber-200/80">{e.strategyKey}</span> · {e.domain} · {new Date(e.createdAt).toLocaleString()}
            </li>
          ))}
        </ul>
      )}

      <h3 className="mt-3 text-sm font-medium text-slate-300">Outcome attribution (heuristic weights)</h3>
      {b.outcome ? (
        <p className="mt-1 text-xs text-slate-400">
          Recorded bucket: <span className="text-slate-200">{b.outcome.outcome}</span>
          {b.outcome.closingTimeDays != null ? ` · ~${b.outcome.closingTimeDays.toFixed(0)}d from open to terminal snapshot` : null}
        </p>
      ) : (
        <p className="mt-1 text-xs text-slate-500">No outcome row yet for this deal (terminal deals get one row for learning).</p>
      )}
      {b.attributed.length === 0 ? (
        <p className="mt-1 text-sm text-slate-500">
          {b.outcome
            ? "No weights computed (or events missing) — see notes above."
            : "Attribution lists appear after a terminal outcome row exists; execution events can still be logging above."}
        </p>
      ) : (
        <ul className="mt-1 list-inside list-decimal text-xs text-slate-400">
          {b.attributed.map((a) => (
            <li key={`${a.domain}-${a.strategyKey}`}>
              {a.strategyKey} <span className="text-slate-600">({a.domain})</span> — weight {a.contributionWeight.toFixed(3)} (explanation only)
            </li>
          ))}
        </ul>
      )}

      <h3 className="mt-3 text-sm font-medium text-slate-300">What worked / what didn’t (qualitative, non-binding)</h3>
      <p className="mt-1 text-xs text-slate-400">{whatWorked}</p>

      {b.notes.length > 0 ? (
        <ul className="mt-2 list-inside list-disc text-xs text-slate-500">
          {b.notes.map((n) => (
            <li key={n.slice(0, 48)}>{n}</li>
          ))}
        </ul>
      ) : null}
      <button type="button" onClick={load} className="mt-2 text-xs text-amber-400">
        Refresh
      </button>
    </section>
  );
}
