"use client";

import * as React from "react";
import type { AiAutopilotActionWithStatus, AiAutopilotSignalStrength } from "@/modules/growth/ai-autopilot.types";
import type { GrowthPolicyEnforcementSnapshot } from "@/modules/growth/growth-policy-enforcement.types";
import { applyPolicyToAutopilotUi } from "@/modules/growth/growth-policy-enforcement-bridge.service";
import { GrowthGovernancePolicyDomainBadge } from "./GrowthGovernancePolicyDomainBadge";

function approvalBadgeClass(status: AiAutopilotActionWithStatus["status"]): string {
  if (status === "approved") return "bg-emerald-500/20 text-emerald-300 border-emerald-500/40";
  if (status === "rejected") return "bg-red-500/15 text-red-300 border-red-500/35";
  return "bg-zinc-700/50 text-zinc-400 border-zinc-600/60";
}

function execBadgeClass(es: AiAutopilotActionWithStatus["executionStatus"]): string {
  if (es === "executed") return "bg-blue-500/15 text-blue-200 border-blue-500/30";
  if (es === "failed") return "bg-amber-500/15 text-amber-200 border-amber-500/35";
  if (es === "rolled_back") return "bg-zinc-600/30 text-zinc-300 border-zinc-500/40";
  return "bg-zinc-800/60 text-zinc-500 border-zinc-700/50";
}

function priorityBadgeClass(score: number): string {
  if (score >= 72) return "border-amber-400/50 bg-amber-500/15 text-amber-100";
  if (score >= 48) return "border-violet-400/40 bg-violet-500/10 text-violet-100";
  return "border-zinc-600 bg-zinc-800/80 text-zinc-300";
}

function signalLabel(s: AiAutopilotSignalStrength): string {
  if (s === "strong") return "strong";
  if (s === "medium") return "medium";
  return "low";
}

type PanelApi = {
  actions: AiAutopilotActionWithStatus[];
  autopilotStatus?: "healthy" | "attention";
  focusTitle?: string | null;
  panelSignalStrength?: AiAutopilotSignalStrength;
};

export function GrowthAiAutopilotPanel({
  executionEnabled,
  rollbackEnabled,
  governanceAdvisoryBadge,
  policyBadgeEnabled,
  enforcementSnapshot,
}: {
  executionEnabled: boolean;
  rollbackEnabled: boolean;
  /** When true, shows a small advisory label if governance status is freeze/review (does not block actions). */
  governanceAdvisoryBadge?: boolean;
  /** Display-only policy mode from governance policy API when console flags are on. */
  policyBadgeEnabled?: boolean;
  /** Optional enforcement layer — gates advisory conversion / safe execution affordances only. */
  enforcementSnapshot?: GrowthPolicyEnforcementSnapshot | null;
}) {
  const [payload, setPayload] = React.useState<PanelApi | null>(null);
  const [err, setErr] = React.useState<string | null>(null);
  const [busy, setBusy] = React.useState<string | null>(null);
  const [execSummary, setExecSummary] = React.useState<string | null>(null);
  const [govHint, setGovHint] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!governanceAdvisoryBadge) {
      setGovHint(null);
      return;
    }
    let cancelled = false;
    void fetch("/api/growth/governance", { credentials: "same-origin" })
      .then(async (r) => {
        const j = await r.json();
        if (!r.ok) return;
        return j as { decision?: { status?: string } };
      })
      .then((j) => {
        if (cancelled || !j?.decision?.status) return;
        const s = j.decision.status;
        if (s === "freeze_recommended" || s === "human_review_required") {
          setGovHint(s.replace(/_/g, " "));
        } else if (s === "caution" || s === "watch") {
          setGovHint(`Governance ${s.replace(/_/g, " ")}`);
        } else {
          setGovHint(null);
        }
      })
      .catch(() => {
        if (!cancelled) setGovHint(null);
      });
    return () => {
      cancelled = true;
    };
  }, [governanceAdvisoryBadge]);

  const load = React.useCallback(() => {
    setErr(null);
    setExecSummary(null);
    void fetch("/api/growth/ai-autopilot", { credentials: "same-origin" })
      .then((r) => r.json())
      .then((j) => {
        if (j.error) throw new Error(j.error);
        setPayload({
          actions: j.actions ?? [],
          autopilotStatus: j.autopilotStatus,
          focusTitle: j.focusTitle,
          panelSignalStrength: j.panelSignalStrength,
        });
      })
      .catch((e: Error) => {
        setErr(e.message);
        setPayload(null);
      });
  }, []);

  React.useEffect(() => {
    load();
  }, [load]);

  const sorted = React.useMemo(() => {
    const a = payload?.actions;
    if (!a) return [];
    return [...a].sort((x, y) => y.priorityScore - x.priorityScore);
  }, [payload?.actions]);

  const policyGate = React.useMemo(() => applyPolicyToAutopilotUi(enforcementSnapshot ?? null), [enforcementSnapshot]);

  async function approve(id: string) {
    setBusy(id);
    setExecSummary(null);
    try {
      const r = await fetch("/api/growth/ai-autopilot/approve", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ actionId: id }),
      });
      await r.json();
      if (!r.ok) throw new Error("Approve failed");
      load();
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "Approve failed");
    } finally {
      setBusy(null);
    }
  }

  async function reject(id: string) {
    setBusy(id);
    setExecSummary(null);
    try {
      const r = await fetch("/api/growth/ai-autopilot/reject", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ actionId: id }),
      });
      await r.json();
      if (!r.ok) throw new Error("Reject failed");
      load();
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "Reject failed");
    } finally {
      setBusy(null);
    }
  }

  async function runSafe() {
    setBusy("exec");
    setExecSummary(null);
    try {
      const r = await fetch("/api/growth/ai-autopilot/execute-safe", {
        method: "POST",
        credentials: "same-origin",
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error ?? "Execution failed");
      const parts = [
        `attempted=${j.attempted ?? 0}`,
        `executed=${j.executed ?? 0}`,
        `skipped=${j.skipped ?? 0}`,
        `failed=${j.failed ?? 0}`,
      ];
      setExecSummary(parts.join(", "));
      load();
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "Execution failed");
    } finally {
      setBusy(null);
    }
  }

  async function rollback(id: string) {
    setBusy(id);
    try {
      const r = await fetch("/api/growth/ai-autopilot/rollback", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ actionId: id }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error ?? "Rollback failed");
      if (!j.ok) throw new Error(j.reason ?? "Rollback failed");
      load();
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "Rollback failed");
    } finally {
      setBusy(null);
    }
  }

  if (err && !payload) {
    return (
      <div id="growth-ai-autopilot-panel" className="rounded-xl border border-red-900/50 bg-red-950/20 p-4">
        <h3 className="text-sm font-semibold text-red-200">AI Autopilot</h3>
        <p className="mt-2 text-sm text-red-300">{err}</p>
        <button
          type="button"
          onClick={() => load()}
          className="mt-2 text-xs text-red-200/80 underline hover:text-red-100"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!payload) {
    return (
      <div id="growth-ai-autopilot-panel" className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4">
        <p className="text-sm text-zinc-500">Loading AI Autopilot…</p>
      </div>
    );
  }

  const focus = payload.focusTitle ?? sorted[0]?.title ?? null;
  const panelSig = payload.panelSignalStrength;

  return (
    <div
      id="growth-ai-autopilot-panel"
      className="rounded-xl border border-violet-900/40 bg-violet-950/20 p-4"
    >
      <div className="flex flex-wrap items-center gap-2">
        <h3 className="text-sm font-semibold text-violet-200">AI Autopilot (safe mode)</h3>
        {govHint ? (
          <span className="rounded-full border border-amber-500/40 bg-amber-950/35 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-amber-100/95">
            Governance: {govHint}
          </span>
        ) : null}
        {policyGate.badge ? (
          <span className="rounded-full border border-zinc-600 bg-zinc-800/80 px-2 py-0.5 text-[10px] font-medium text-zinc-300">
            {policyGate.badge}
          </span>
        ) : null}
        <GrowthGovernancePolicyDomainBadge domain="autopilot" enabled={policyBadgeEnabled} />
      </div>
      <p className="mt-1 text-xs text-amber-200/80">
        Only low-risk internal actions can be executed (timeline notes + internal launch flags). Advisory items stay
        review-only. No payments, bookings, ranking, ads spend, or legal changes.
      </p>
      {policyGate.notes.length > 0 ? (
        <p className="mt-2 text-[11px] text-zinc-500">{policyGate.notes.join(" · ")}</p>
      ) : null}

      {panelSig ? (
        <p className="mt-2 text-[11px] text-zinc-500">
          Signal strength (snapshot):{" "}
          <span className="font-medium text-zinc-300">{signalLabel(panelSig)}</span>
        </p>
      ) : null}

      {payload.autopilotStatus === "healthy" ? (
        <p className="mt-3 rounded-lg border border-emerald-500/30 bg-emerald-950/25 px-3 py-2 text-sm text-emerald-100/95">
          System performing well — no immediate actions needed
        </p>
      ) : null}

      {focus ? (
        <p className="mt-3 rounded-lg border border-amber-500/25 bg-amber-950/20 px-3 py-2 text-sm font-medium text-amber-100/95">
          🎯 Focus: {focus}
        </p>
      ) : null}

      <ul className="mt-4 space-y-3">
        {sorted.map((a) => (
          <li key={a.id} className="rounded-lg border border-zinc-800 bg-zinc-950/50 p-3 text-sm">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded border border-zinc-600 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-zinc-400">
                    {a.source}
                  </span>
                  <span
                    className={`rounded-full border px-2 py-0.5 text-[11px] font-semibold ${priorityBadgeClass(a.priorityScore)}`}
                  >
                    P {a.priorityScore}
                  </span>
                </div>
                <p className="mt-1.5 font-medium text-zinc-100">{a.title}</p>
                <p className="mt-1 text-xs text-zinc-500">{a.why}</p>
                <p className="mt-1 text-xs text-zinc-400">{a.description}</p>
                <p className="mt-2 text-[11px] uppercase tracking-wide text-zinc-500">
                  impact {a.impact} · confidence {(a.confidence * 100).toFixed(0)}% · signal{" "}
                  {signalLabel(a.signalStrength)} ·{" "}
                  {a.executionMode === "manual_only" ? "manual checklist" : a.executionMode}
                </p>
                <p className="mt-1 text-[11px] text-zinc-500">
                  {a.actionType ? (
                    <>
                      type <span className="text-zinc-400">{a.actionType}</span>
                      {a.domain ? (
                        <>
                          {" "}
                          · domain <span className="text-zinc-400">{a.domain}</span>
                        </>
                      ) : null}
                      {a.reversible != null ? (
                        <>
                          {" "}
                          · reversible {a.reversible ? "yes" : "no"}
                        </>
                      ) : null}
                    </>
                  ) : (
                    <span className="text-zinc-600">Advisory (not executable)</span>
                  )}
                </p>
                {a.executionError ? (
                  <p className="mt-1 text-[11px] text-amber-300/90">Exec: {a.executionError}</p>
                ) : null}
              </div>
              <div className="flex flex-col items-end gap-1">
                <span
                  className={`shrink-0 rounded-full border px-2 py-0.5 text-[11px] font-semibold ${approvalBadgeClass(a.status)}`}
                >
                  {a.status}
                </span>
                <span
                  className={`shrink-0 rounded-full border px-2 py-0.5 text-[11px] font-semibold ${execBadgeClass(a.executionStatus)}`}
                >
                  {a.executionStatus ?? "none"}
                </span>
              </div>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                disabled={busy !== null || a.status === "approved" || policyGate.hideAdvisoryConversionAffordances}
                onClick={() => void approve(a.id)}
                className="rounded-md bg-emerald-600/30 px-3 py-1.5 text-xs font-semibold text-emerald-200 hover:bg-emerald-600/45 disabled:opacity-40"
              >
                Approve
              </button>
              <button
                type="button"
                disabled={busy !== null || a.status === "rejected"}
                onClick={() => void reject(a.id)}
                className="rounded-md bg-red-600/25 px-3 py-1.5 text-xs font-semibold text-red-200 hover:bg-red-600/40 disabled:opacity-40"
              >
                Reject
              </button>
              {executionEnabled && rollbackEnabled && a.executionStatus === "executed" && a.reversible ? (
                <button
                  type="button"
                  disabled={busy !== null}
                  onClick={() => void rollback(a.id)}
                  className="rounded-md border border-zinc-600 px-3 py-1.5 text-xs font-semibold text-zinc-200 hover:bg-zinc-800/80 disabled:opacity-40"
                >
                  Rollback
                </button>
              ) : null}
            </div>
          </li>
        ))}
      </ul>

      {executionEnabled ? (
        <div className="mt-4 border-t border-violet-800/40 pt-4">
          <button
            type="button"
            disabled={busy !== null || policyGate.disableSafeExecutionButton}
            onClick={() => void runSafe()}
            className="w-full rounded-lg border border-violet-500/40 bg-violet-900/30 py-2 text-sm font-semibold text-violet-100 hover:bg-violet-900/50 disabled:opacity-50"
          >
            {busy === "exec" ? "Running…" : "Execute Approved Safe Actions"}
          </button>
          {execSummary ? <p className="mt-2 text-center text-xs text-zinc-400">{execSummary}</p> : null}
        </div>
      ) : (
        <p className="mt-3 text-[11px] text-zinc-500">
          Enable <code className="text-zinc-400">FEATURE_AI_AUTOPILOT_EXECUTION_V1</code> for controlled execution.
        </p>
      )}
      {rollbackEnabled ? null : (
        <p className="mt-2 text-[11px] text-zinc-600">
          Rollback hidden — set <code className="text-zinc-500">FEATURE_AI_AUTOPILOT_ROLLBACK_V1</code>.
        </p>
      )}
    </div>
  );
}
