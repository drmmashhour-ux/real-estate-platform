"use client";

import * as React from "react";
import type { GrowthLearningControlDecision } from "@/modules/growth/growth-governance-learning.types";

function stateBadge(s: GrowthLearningControlDecision["state"]): string {
  if (s === "normal") return "border-emerald-500/50 bg-emerald-950/35 text-emerald-100";
  if (s === "monitor") return "border-amber-500/50 bg-amber-950/35 text-amber-100";
  if (s === "freeze_recommended") return "border-rose-500/45 bg-rose-950/35 text-rose-100";
  return "border-violet-500/45 bg-violet-950/35 text-violet-100";
}

export function GrowthLearningControlPanel() {
  const [control, setControl] = React.useState<GrowthLearningControlDecision | null>(null);
  const [err, setErr] = React.useState<string | null>(null);

  React.useEffect(() => {
    let cancelled = false;
    void fetch("/api/growth/learning", { credentials: "same-origin" })
      .then(async (r) => {
        const j = await r.json();
        if (!r.ok) throw new Error(j.error ?? "Learning control load failed");
        return j as { learningControl: GrowthLearningControlDecision };
      })
      .then((j) => {
        if (!cancelled) setControl(j.learningControl);
      })
      .catch((e: Error) => {
        if (!cancelled) setErr(e.message);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (err) return <p className="text-sm text-red-400">{err}</p>;
  if (!control) return <p className="text-sm text-zinc-500">Loading learning control…</p>;

  const sig = control.observedSignals;

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-4">
      <h3 className="text-sm font-semibold text-slate-100">🛡 Learning Control</h3>
      <p className="mt-1 text-xs text-zinc-500">
        Governance + learning advisory gate — no automatic enforcement; weight updates only when policy allows.
      </p>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <span
          className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide ${stateBadge(control.state)}`}
        >
          {control.state.replace(/_/g, " ")}
        </span>
        <span className="text-[11px] text-zinc-600">
          confidence {(control.confidence * 100).toFixed(0)}%
        </span>
      </div>

      <div className="mt-4 border-t border-slate-800 pt-3">
        <p className="text-[11px] font-semibold uppercase text-zinc-500">Key signals</p>
        <ul className="mt-2 grid gap-1 text-[11px] text-zinc-400 sm:grid-cols-2">
          {sig.negativeRate != null ? (
            <li>
              Negative rate: <strong className="text-zinc-200">{(sig.negativeRate * 100).toFixed(0)}%</strong>
            </li>
          ) : null}
          {sig.insufficientDataRate != null ? (
            <li>
              Insufficient data: <strong className="text-zinc-200">{(sig.insufficientDataRate * 100).toFixed(0)}%</strong>
            </li>
          ) : null}
          {sig.weightDrift != null ? (
            <li>
              Weight drift: <strong className="text-zinc-200">{sig.weightDrift.toFixed(3)}</strong>
            </li>
          ) : null}
          {sig.governanceRisk ? (
            <li>
              Governance risk: <strong className="text-zinc-200">{sig.governanceRisk}</strong>
            </li>
          ) : null}
          {sig.executionErrors != null ? (
            <li>
              Execution failures (counter): <strong className="text-zinc-200">{sig.executionErrors}</strong>
            </li>
          ) : null}
        </ul>
      </div>

      <div className="mt-4 border-t border-slate-800 pt-3">
        <p className="text-[11px] font-semibold uppercase text-zinc-500">Reasons</p>
        <ul className="mt-2 space-y-1 text-xs text-zinc-400">
          {control.reasons.map((r) => (
            <li key={r.code}>
              <span className="font-mono text-[10px] text-zinc-600">{r.code}</span> — {r.message}
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-4 border-t border-slate-800 pt-3">
        <p className="text-[11px] font-semibold uppercase text-zinc-500">Recommended actions</p>
        <ul className="mt-2 list-inside list-disc text-xs text-slate-300/90">
          {control.recommendedActions.map((a) => (
            <li key={a}>{a}</li>
          ))}
        </ul>
      </div>

      <p className="mt-4 text-[11px] text-zinc-600">
        No automatic enforcement — advisory + gated learning only. Human review for resets.
      </p>
    </div>
  );
}
