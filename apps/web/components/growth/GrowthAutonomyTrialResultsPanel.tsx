"use client";

import * as React from "react";
import type { GrowthAutonomyTrialOutcomeSummary } from "@/modules/growth/growth-autonomy-trial-results.types";
import { ADJACENT_INTERNAL_TRIAL_LABEL } from "@/modules/growth/growth-autonomy-trial-boundaries";
import { TRIAL_FEEDBACK_LABELS, type GrowthAutonomyTrialOperatorFeedbackKind } from "@/modules/growth/growth-autonomy-trial-feedback.service";

const DECISION_COPY: Record<string, string> = {
  keep_internal: "Useful and stable internally — keep as internal-only assistive signal.",
  hold: "Safe but not conclusive or not useful enough — hold scope; no broadening.",
  rollback: "Conservative rollback / hold posture based on safety or poor signals.",
  eligible_for_future_review: "May be revisited in future manual governance only — not an activation or expansion.",
  insufficient_data: "Not enough signal to judge — do not interpret as success or failure.",
};

function formatPct(n: number | null | undefined): string {
  if (n == null || Number.isNaN(n)) return "—";
  return `${(n * 100).toFixed(0)}%`;
}

export function GrowthAutonomyTrialResultsPanel() {
  const [summary, setSummary] = React.useState<GrowthAutonomyTrialOutcomeSummary | null | undefined>(undefined);
  const [err, setErr] = React.useState<string | null>(null);
  const [fbBusy, setFbBusy] = React.useState(false);
  const [fbMsg, setFbMsg] = React.useState<string | null>(null);

  const load = React.useCallback(() => {
    setErr(null);
    void fetch("/api/growth/autonomy/trial/results", { credentials: "same-origin" })
      .then(async (r) => {
        const j = (await r.json()) as { ok?: boolean; summary?: GrowthAutonomyTrialOutcomeSummary | null; message?: string };
        if (!r.ok) throw new Error(j.message ?? "Results unavailable");
        setSummary(j.summary === undefined ? null : j.summary);
      })
      .catch((e: Error) => setErr(e.message));
  }, []);

  React.useEffect(() => {
    void load();
  }, [load]);

  async function sendFeedback(kind: GrowthAutonomyTrialOperatorFeedbackKind) {
    setFbBusy(true);
    setFbMsg(null);
    try {
      const r = await fetch("/api/growth/autonomy/trial/feedback", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind }),
      });
      const j = (await r.json()) as { ok?: boolean; message?: string };
      if (!r.ok) throw new Error(j.message ?? "Failed");
      setFbMsg("Recorded.");
      void load();
    } catch (e: unknown) {
      setFbMsg(e instanceof Error ? e.message : "Failed");
    } finally {
      setFbBusy(false);
    }
  }

  if (err) {
    return (
      <p className="mt-2 text-[11px] text-red-300" role="alert">
        Trial results: {err}
      </p>
    );
  }

  if (summary === undefined && !err) {
    return <p className="mt-2 text-[11px] text-zinc-500">Loading trial measurement…</p>;
  }

  if (summary === null) {
    return (
      <section className="mt-3 rounded-xl border border-zinc-800 bg-zinc-950/40 p-3" aria-label="Trial results">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-zinc-500">Trial measurement</p>
        <p className="mt-1 text-[11px] text-zinc-400">
          No adjacent trial execution recorded yet — measurement begins after the internal trial artifact is written.
        </p>
      </section>
    );
  }

  return (
    <section className="mt-3 rounded-xl border border-teal-900/40 bg-teal-950/15 p-3" aria-label="Adjacent trial results">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-teal-200">Trial results (single adjacent)</p>
      <p className="mt-1 text-[11px] text-zinc-400">{ADJACENT_INTERNAL_TRIAL_LABEL}</p>

      <div className="mt-2 flex flex-wrap gap-2 text-[10px]">
        <span className="rounded-full border border-teal-800/50 px-2 py-0.5 text-teal-100">
          Decision: <span className="font-mono">{summary.finalDecision}</span>
        </span>
        <span className="rounded-full border border-zinc-700 px-2 py-0.5 text-zinc-400">
          Safety: {summary.safety.level}
        </span>
        <span className="rounded-full border border-zinc-700 px-2 py-0.5 text-zinc-400">
          Usefulness: {summary.usefulnessBand}
        </span>
        <span className="rounded-full border border-zinc-700 px-2 py-0.5 text-zinc-400">
          Sample: {summary.sampleSize}
        </span>
      </div>

      <p className="mt-2 text-[11px] leading-relaxed text-zinc-300">{DECISION_COPY[summary.finalDecision] ?? summary.explanation}</p>
      <ul className="mt-2 list-inside list-disc space-y-0.5 text-[11px] text-zinc-500">
        {summary.operatorLines.map((l) => (
          <li key={l}>{l}</li>
        ))}
      </ul>

      <dl className="mt-3 grid grid-cols-2 gap-x-3 gap-y-1 font-mono text-[10px] text-zinc-500">
        <dt>Activation window</dt>
        <dd>
          {summary.activationWindow.startedAt ?? "—"} → {summary.activationWindow.endedAt}
        </dd>
        <dt>Times surfaced (proxy)</dt>
        <dd>{summary.timesSurfacedInSnapshots}</dd>
        <dt>Usage proxy rate</dt>
        <dd>{formatPct(summary.metrics.usageProxyRate)}</dd>
        <dt>Follow-through</dt>
        <dd>{formatPct(summary.metrics.completionFollowThroughRate)}</dd>
        <dt>Undo / rollback rate</dt>
        <dd>{formatPct(summary.metrics.undoRollbackRate)}</dd>
        <dt>Sparse data</dt>
        <dd>{summary.metrics.sparseData ? "yes" : "no"}</dd>
      </dl>

      <div className="mt-2 text-[10px] text-zinc-600">
        Feedback volume: {summary.operatorFeedback.total} · helpful {summary.operatorFeedback.helpful} · confusing{" "}
        {summary.operatorFeedback.confusing}
      </div>

      <div className="mt-3 border-t border-zinc-800 pt-2">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500">Operator feedback (trial)</p>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {(Object.keys(TRIAL_FEEDBACK_LABELS) as GrowthAutonomyTrialOperatorFeedbackKind[]).map((k) => (
            <button
              key={k}
              type="button"
              disabled={fbBusy}
              className="rounded border border-zinc-700 px-2 py-1 text-[10px] text-zinc-300 hover:bg-zinc-900 disabled:opacity-40"
              onClick={() => void sendFeedback(k)}
            >
              {TRIAL_FEEDBACK_LABELS[k]}
            </button>
          ))}
        </div>
        {fbMsg ? <p className="mt-1 text-[10px] text-zinc-500">{fbMsg}</p> : null}
      </div>

      <button
        type="button"
        className="mt-2 text-[10px] text-teal-400 underline"
        onClick={() => void load()}
      >
        Refresh measurement
      </button>

      <p className="mt-4 rounded border border-zinc-800/90 bg-black/35 p-2 text-[10px] leading-relaxed text-zinc-500">
        <span className="font-semibold text-zinc-400">Measurement only:</span> this panel scores the{" "}
        <span className="text-zinc-400">existing</span> adjacent trial — it does{" "}
        <span className="text-zinc-400">not</span> start trials, widen the allowlist, or broaden rollout.{" "}
        <span className="text-zinc-400">eligible_for_future_review</span> is governance metadata only (manual review outside
        this UI), never activation. Expansion approvals stay blocked here until explicit human program review elsewhere.
      </p>
    </section>
  );
}
