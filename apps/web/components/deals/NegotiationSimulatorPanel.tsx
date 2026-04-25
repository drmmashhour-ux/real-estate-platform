"use client";

import { useCallback, useEffect, useState } from "react";
import type { NegotiationSimulatorOutput } from "@/modules/negotiation-simulator/negotiation-simulator.types";
import { MomentumRiskCard } from "./MomentumRiskCard";
import { ObjectionForecastPanel } from "./ObjectionForecastPanel";
import { ApproachComparisonTable } from "./ApproachComparisonTable";
import { NegotiationScenarioCard } from "./NegotiationScenarioCard";

type Props = { dealId: string; enabled?: boolean };

export function NegotiationSimulatorPanel({ dealId, enabled = true }: Props) {
  const [s, setS] = useState<NegotiationSimulatorOutput | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [recording, setRecording] = useState(false);

  const load = useCallback(async () => {
    if (!enabled || !dealId) return;
    setLoading(true);
    setErr(null);
    try {
      const res = await fetch(`/api/deals/${encodeURIComponent(dealId)}/negotiation-simulator`, {
        credentials: "same-origin",
      });
      const j = (await res.json()) as { ok?: boolean; simulator?: NegotiationSimulatorOutput; error?: string };
      if (j.ok && j.simulator) setS(j.simulator);
      else setErr(j.error ?? "Could not load negotiation simulation");
    } catch {
      setErr("Could not load negotiation simulation");
    } finally {
      setLoading(false);
    }
  }, [dealId, enabled]);

  const recordUse = useCallback(
    async (approachKey: string) => {
      if (!dealId) return;
      setRecording(true);
      try {
        await fetch(`/api/deals/${encodeURIComponent(dealId)}/negotiation-simulator`, {
          method: "POST",
          headers: { "content-type": "application/json" },
          credentials: "same-origin",
          body: JSON.stringify({ action: "record_strategy", approachKey }),
        });
      } catch {
        /* no-op: suggest-only; logging best-effort */
      } finally {
        setRecording(false);
      }
    },
    [dealId]
  );

  useEffect(() => {
    void load();
  }, [load]);

  if (!enabled) return null;
  if (loading) {
    return (
      <section className="rounded-lg border border-slate-800 bg-slate-900/60 p-4">
        <h2 className="text-lg font-medium text-slate-200">Negotiation path simulator (AI)</h2>
        <p className="mt-2 text-sm text-slate-500">Loading…</p>
      </section>
    );
  }
  if (err || !s) {
    return (
      <section className="rounded-lg border border-slate-800 bg-slate-900/60 p-4">
        <h2 className="text-lg font-medium text-slate-200">Negotiation path simulator (AI)</h2>
        <p className="mt-2 text-sm text-rose-300">{err ?? "No data"}</p>
        <button type="button" onClick={load} className="mt-2 text-xs text-amber-400 hover:text-amber-300">
          Retry
        </button>
      </section>
    );
  }

  return (
    <section className="rounded-lg border border-slate-800 bg-slate-900/60 p-4">
      <h2 className="text-lg font-medium text-slate-200">Negotiation path simulator (AI)</h2>
      <p className="mt-1 text-xs text-slate-500">
        Scenarios and bands are coaching aids only — not legal advice, not price guarantees, not automatic next steps. You choose all
        messaging and actions; nothing is sent for you.
      </p>
      <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-stretch">
        <div className="flex-1 rounded border border-emerald-900/50 bg-slate-950/40 p-2">
          <p className="text-xs text-slate-500">Heuristic: lower friction path</p>
          <p className="text-sm text-emerald-200">{s.safestApproach ? s.safestApproach.replace(/_/g, " ") : "—"}</p>
        </div>
        <div className="flex-1 rounded border border-amber-900/50 bg-slate-950/40 p-2">
          <p className="text-xs text-slate-500">Heuristic: strong progress lean (still scenario-based)</p>
          <p className="text-sm text-amber-200/90">
            {s.highestUpsideApproach ? s.highestUpsideApproach.replace(/_/g, " ") : "—"}
          </p>
        </div>
      </div>
      {s.safestApproach ? (
        <div className="mt-2">
          <button
            type="button"
            disabled={recording}
            onClick={() => void recordUse(s.safestApproach as string)}
            className="text-xs text-amber-400/90 hover:text-amber-300 disabled:opacity-50"
          >
            I’m planning to use the &quot;{s.safestApproach?.replace(/_/g, " ")}&quot; line (for learning, not auto-send)
          </button>
        </div>
      ) : null}
      <div className="mt-3">
        <MomentumRiskCard m={s.momentumRisk} />
      </div>
      <div className="mt-3">
        <h3 className="text-sm font-medium text-slate-300">Objection / concern lean (not predictions)</h3>
        <div className="mt-1">
          <ObjectionForecastPanel f={s.objectionForecast} />
        </div>
      </div>
      {s.coachNotes.length > 0 ? (
        <div className="mt-3">
          <h3 className="text-sm font-medium text-slate-300">Coach notes</h3>
          <ul className="mt-1 list-inside list-disc text-xs text-slate-400">
            {s.coachNotes.map((c) => (
              <li key={c.slice(0, 40)}>{c}</li>
            ))}
          </ul>
        </div>
      ) : null}
      <div className="mt-4">
        <h3 className="text-sm font-medium text-slate-300">Compare approaches</h3>
        <div className="mt-1">
          <ApproachComparisonTable scenarios={s.scenarios} />
        </div>
      </div>
      <div className="mt-4">
        <h3 className="text-sm font-medium text-slate-300">Scenarios (detail)</h3>
        <ul className="mt-2 space-y-2">
          {s.scenarios.map((x) => (
            <li key={x.approachKey}>
              <NegotiationScenarioCard s={x} />
            </li>
          ))}
        </ul>
      </div>
      <button type="button" onClick={load} className="mt-3 text-xs text-amber-400 hover:text-amber-300">
        Refresh
      </button>
    </section>
  );
}
