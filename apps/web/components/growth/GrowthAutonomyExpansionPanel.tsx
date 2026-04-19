"use client";

import * as React from "react";

import type { GrowthAutonomyExpansionReport } from "@/modules/growth/growth-autonomy-expansion.types";

export function GrowthAutonomyExpansionPanel({ viewerIsAdmin }: { viewerIsAdmin: boolean }) {
  const [report, setReport] = React.useState<GrowthAutonomyExpansionReport | null>(null);
  const [err, setErr] = React.useState<string | null>(null);
  const [msg, setMsg] = React.useState<string | null>(null);

  async function refresh() {
    setErr(null);
    try {
      const r = await fetch("/api/growth/autonomy/expansion", { credentials: "same-origin" });
      const j = (await r.json()) as { ok?: boolean; report?: GrowthAutonomyExpansionReport };
      if (!r.ok || !j.ok || !j.report) throw new Error("Expansion unavailable");
      setReport(j.report);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Failed to load");
      setReport(null);
    }
  }

  React.useEffect(() => {
    void refresh();
  }, []);

  async function post(action: string, extra?: Record<string, unknown>) {
    setMsg(null);
    try {
      const r = await fetch("/api/growth/autonomy/expansion", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, ...extra }),
      });
      const j = (await r.json()) as { ok?: boolean; message?: string };
      if (!r.ok || !j.ok) throw new Error(j.message ?? "Request failed");
      setMsg("Saved.");
      await refresh();
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Failed");
    }
  }

  if (!report && !err) {
    return <p className="mt-2 text-[10px] text-zinc-600">Loading expansion governance…</p>;
  }

  if (report && !report.expansionFeatureOn && !report.expansionPanelOn) {
    return (
      <p className="mt-2 text-[10px] text-zinc-600">
        Expansion governance is off — enable{" "}
        <code className="rounded bg-black/30 px-1">FEATURE_GROWTH_AUTONOMY_EXPANSION_V1</code> or the panel flag for
        evaluation.
      </p>
    );
  }

  if (!report) return null;

  return (
    <section className="mt-3 rounded-lg border border-cyan-900/35 bg-cyan-950/15 px-3 py-2.5" aria-label="Expansion governance">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-cyan-300">Evidence-based expansion</p>
        <span className="text-[10px] text-zinc-500">
          Freeze:{" "}
          <span className={report.expansionFreezeFlag ? "text-amber-300" : "text-zinc-400"}>
            {report.expansionFreezeFlag ? "on" : "off"}
          </span>
        </span>
      </div>
      <p className="mt-1 text-[10px] leading-snug text-zinc-500">
        Proposes adjacent <strong className="font-normal text-zinc-400">internal-only</strong> trials only. Never
        payments, bookings, ads, CRO, pricing, external sends, or irreversible automation. Approvals are explicit and
        stored.
      </p>

      {report.auditHealth.healthy ?
        <p className="mt-1 text-[10px] text-emerald-400/90">Audit health: OK for this window.</p>
      : <p className="mt-1 text-[10px] text-amber-200/90">Audit health blocked: {report.auditHealth.reasons.join(" ")}</p>}

      {report.adjacentTrialGovernanceLock?.blocksExpansionApprovals ?
        <div className="mt-2 rounded border border-amber-900/45 bg-amber-950/25 p-2 text-[10px] leading-relaxed text-amber-100/95">
          <span className="font-semibold text-amber-50">Expansion locked (adjacent trial governance):</span>{" "}
          {report.adjacentTrialGovernanceLock.reason}
          {report.adjacentTrialGovernanceLock.trialOutcomeDecision ?
            <>
              {" "}
              · Last trial decision:{" "}
              <span className="font-mono">{report.adjacentTrialGovernanceLock.trialOutcomeDecision}</span>
            </>
          : null}
        </div>
      : null}

      {viewerIsAdmin ?
        <div className="mt-2 flex flex-wrap gap-2">
          <button
            type="button"
            className="rounded border border-zinc-700 px-2 py-1 text-[10px] text-zinc-300 hover:bg-zinc-900"
            onClick={() => void post("set_freeze", { freeze: !report.expansionFreezeFlag })}
          >
            Toggle stored freeze
          </button>
          <button
            type="button"
            className="rounded border border-zinc-700 px-2 py-1 text-[10px] text-zinc-300 hover:bg-zinc-900"
            onClick={() => void refresh()}
          >
            Refresh evidence
          </button>
          {msg ? <span className="text-[10px] text-zinc-500">{msg}</span> : null}
        </div>
      : null}

      {err ?
        <p className="mt-2 text-[10px] text-red-300">{err}</p>
      : null}

      <div className="mt-2 space-y-2">
        <p className="text-[10px] font-semibold text-zinc-500">Parent patterns (allowlisted)</p>
        <ul className="space-y-1 text-[10px] text-zinc-400">
          {report.parentOutcomes.map((p) => (
            <li key={p.evidence.lowRiskActionKey} className="rounded border border-zinc-800/80 bg-black/20 px-2 py-1">
              <span className="font-mono text-zinc-300">{String(p.evidence.lowRiskActionKey)}</span> · n=
              {p.evidence.sampleSizeExecuted} · undo {(p.evidence.undoRate * 100).toFixed(0)}% ·{" "}
              <span className="text-zinc-500">{p.status}</span>
              <div className="text-[9px] text-zinc-600">{p.explanation}</div>
            </li>
          ))}
        </ul>

        <p className="text-[10px] font-semibold text-zinc-500">Adjacent candidates</p>
        <ul className="space-y-1 text-[10px] text-zinc-400">
          {report.candidateOutcomes.map((c) => (
            <li key={c.candidate.id} className="rounded border border-zinc-800/80 bg-black/20 px-2 py-1">
              <span className="font-mono text-zinc-300">{c.candidate.id}</span> · {c.status}
              <div className="text-[9px] text-zinc-600">{c.explanation}</div>
              {viewerIsAdmin && c.status === "eligible_for_trial" ?
                <button
                  type="button"
                  className="mt-1 text-[9px] text-cyan-400 underline"
                  onClick={() => void post("approve_trial", { candidateId: c.candidate.id, note: "panel-approve" })}
                >
                  Record approval (internal trial registry)
                </button>
              : null}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
