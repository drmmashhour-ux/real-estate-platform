"use client";

import { useCallback, useEffect, useState } from "react";
import { ClosingReadinessMeter } from "./ClosingReadinessMeter";
import { CloseBlockersPanel } from "./CloseBlockersPanel";
import { NextCloseActionsList } from "./NextCloseActionsList";
import { PrematurePushWarning } from "./PrematurePushWarning";

type CloserPayload = {
  readiness: { score: number; label: "not_ready" | "warming_up" | "close_ready" | "high_intent"; rationale: string[] };
  blockers: { key: string; label: string; severity: "low" | "medium" | "high"; rationale: string[] }[];
  nextActions: {
    key: string;
    title: string;
    priority: "low" | "medium" | "high";
    rationale: string[];
    suggestedApproach?: string;
    suggestedMessageGoal?: string;
  }[];
  prematurePushRisk: "low" | "medium" | "high";
  closeStrategy: string[];
  coachNotes: string[];
};

type Props = { dealId: string; enabled?: boolean };

/**
 * Fetches /api/deals/:id/closer. Broker-side only (API enforces). Suggestions, not auto-actions.
 */
export function DealCloserPanel({ dealId, enabled = true }: Props) {
  const [data, setData] = useState<CloserPayload | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!enabled || !dealId) return;
    setLoading(true);
    setErr(null);
    try {
      const res = await fetch(`/api/deals/${encodeURIComponent(dealId)}/closer`, { credentials: "same-origin" });
      const j = (await res.json()) as { ok?: boolean; closer?: CloserPayload; error?: string };
      if (j.ok && j.closer) setData(j.closer);
      else setErr(j.error ?? "Could not load deal closer");
    } catch {
      setErr("Could not load deal closer");
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
        <h2 className="text-lg font-medium text-slate-200">Deal closer (AI)</h2>
        <p className="mt-2 text-sm text-slate-500">Loading…</p>
      </section>
    );
  }
  if (err || !data) {
    return (
      <section className="rounded-lg border border-slate-800 bg-slate-900/60 p-4">
        <h2 className="text-lg font-medium text-slate-200">Deal closer (AI)</h2>
        <p className="mt-2 text-sm text-rose-300">{err ?? "No data."}</p>
        <button
          type="button"
          onClick={load}
          className="mt-2 text-xs text-amber-400 hover:text-amber-300"
        >
          Retry
        </button>
      </section>
    );
  }

  return (
    <section className="rounded-lg border border-slate-800 bg-slate-900/60 p-4">
      <h2 className="text-lg font-medium text-slate-200">Deal closer (AI)</h2>
      <p className="mt-1 text-xs text-slate-500">
        Suggestions and coaching only — not legal, financial, or tax advice. Nothing is sent to clients automatically.
      </p>
      <div className="mt-4 max-w-sm">
        <ClosingReadinessMeter score={data.readiness.score} label={data.readiness.label} />
      </div>
      {data.readiness.rationale.length > 0 ? (
        <ul className="mt-2 list-inside list-disc text-xs text-slate-400">
          {data.readiness.rationale.slice(0, 3).map((r) => (
            <li key={r.slice(0, 32)}>{r}</li>
          ))}
        </ul>
      ) : null}
      <div className="mt-4">
        <h3 className="text-sm font-medium text-slate-300">Blockers (heuristic)</h3>
        <div className="mt-2">
          <CloseBlockersPanel blockers={data.blockers} />
        </div>
      </div>
      <div className="mt-4">
        <PrematurePushWarning level={data.prematurePushRisk} />
      </div>
      <div className="mt-4">
        <h3 className="text-sm font-medium text-slate-300">Next close actions (you choose)</h3>
        <div className="mt-2">
          <NextCloseActionsList actions={data.nextActions} />
        </div>
      </div>
      {data.closeStrategy.length > 0 ? (
        <div className="mt-4">
          <h3 className="text-sm font-medium text-slate-300">Strategy hints</h3>
          <ul className="mt-1 list-inside list-disc text-xs text-slate-400">
            {data.closeStrategy.map((s) => (
              <li key={s.slice(0, 40)}>{s}</li>
            ))}
          </ul>
        </div>
      ) : null}
      {data.coachNotes.length > 0 ? (
        <div className="mt-4">
          <h3 className="text-sm font-medium text-slate-300">Coach notes</h3>
          <ul className="mt-1 list-inside list-disc text-xs text-slate-400">
            {data.coachNotes.map((c) => (
              <li key={c.slice(0, 40)}>{c}</li>
            ))}
          </ul>
        </div>
      ) : null}
      <button type="button" onClick={load} className="mt-3 text-xs text-amber-400 hover:text-amber-300">
        Refresh
      </button>
    </section>
  );
}
