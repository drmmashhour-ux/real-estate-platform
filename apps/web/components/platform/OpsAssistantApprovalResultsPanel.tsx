"use client";

import type { ApprovalExecutionOutcomeSummary } from "@/modules/platform/ops-assistant/approval-execution-results.types";
import {
  APPROVAL_EXECUTION_EXPANSION_LOCK_MESSAGE,
  APPROVAL_EXECUTION_EXPANSION_LOCKED,
} from "@/modules/platform/ops-assistant/approval-execution-results.types";

function tone(decision: ApprovalExecutionOutcomeSummary["finalDecision"]): string {
  switch (decision) {
    case "eligible_for_future_review":
      return "border-emerald-800 bg-emerald-950/35 text-emerald-100";
    case "rollback_candidate":
      return "border-rose-800 bg-rose-950/35 text-rose-100";
    case "insufficient_data":
      return "border-slate-600 bg-slate-900 text-slate-300";
    case "hold":
      return "border-amber-800 bg-amber-950/30 text-amber-100";
    default:
      return "border-sky-800 bg-sky-950/30 text-sky-100";
  }
}

export function OpsAssistantApprovalResultsPanel({ summary }: { summary: ApprovalExecutionOutcomeSummary }) {
  const t = summary.totals;
  return (
    <div className="rounded-lg border border-teal-900/40 bg-teal-950/15 p-4">
      <h2 className="text-xs font-semibold uppercase tracking-wide text-teal-300">Approval execution — results</h2>
      <p className="mt-1 text-[11px] text-slate-500">
        Evidence-only readout for operator trust. Does not change flags, allowlists, or autonomy — labels are advisory.
      </p>

      {APPROVAL_EXECUTION_EXPANSION_LOCKED ? (
        <p className="mt-2 rounded border border-amber-900/50 bg-amber-950/25 px-2 py-1.5 text-[11px] text-amber-100">
          {APPROVAL_EXECUTION_EXPANSION_LOCK_MESSAGE} No new executable actions may be added until outcomes are reviewed
          manually.
        </p>
      ) : null}

      <div className="mt-3 grid grid-cols-2 gap-2 text-[11px] sm:grid-cols-3">
        <Metric label="Requests" value={t.requestCount} />
        <Metric label="Approvals" value={t.approvalCount} />
        <Metric label="Denials" value={t.denialCount} />
        <Metric label="Executions" value={t.executionCount} />
        <Metric label="Undos" value={t.undoCount} />
        <Metric label="Failures" value={t.failureCount} />
        <Metric label="Blocked (safety)" value={t.blockedBySafetyCount} />
      </div>

      <dl className="mt-3 space-y-1 text-[11px] text-slate-400">
        <div>
          <dt className="inline text-slate-500">Window · </dt>
          <dd className="inline text-slate-300">{summary.window.label}</dd>
        </div>
        <div>
          <dt className="inline text-slate-500">Safety · </dt>
          <dd className="inline text-slate-200">{summary.safetyEvaluation}</dd>
        </div>
        <div>
          <dt className="inline text-slate-500">Usefulness · </dt>
          <dd className="inline text-slate-200">{summary.usefulnessEvaluation}</dd>
        </div>
        <div>
          <dt className="inline text-slate-500">Rates · </dt>
          <dd className="inline text-slate-300">
            approve {pct(summary.rates.approvalRate)} · exec success {pct(summary.rates.executionSuccessRate)} · undo{" "}
            {pct(summary.rates.undoRate)} · fail {pct(summary.rates.failureRate)}
          </dd>
        </div>
      </dl>

      <div className={`mt-3 rounded border px-2 py-2 text-[11px] ${tone(summary.finalDecision)}`}>
        <span className="font-semibold uppercase tracking-wide">Decision · {summary.finalDecision.replace(/_/g, " ")}</span>
        <p className="mt-1 text-[11px] leading-snug opacity-95">{summary.explanation}</p>
      </div>

      <p className="mt-2 text-[10px] text-slate-500">{summary.operatorFeedbackSummary}</p>

      {summary.byActionType.length > 0 ? (
        <div className="mt-3 overflow-x-auto">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">By action type</p>
          <table className="mt-1 w-full min-w-[420px] border-collapse text-left text-[10px] text-slate-400">
            <thead>
              <tr className="border-b border-slate-800 text-slate-500">
                <th className="py-1 pr-2">Action</th>
                <th className="py-1 pr-2">Req</th>
                <th className="py-1 pr-2">Appr</th>
                <th className="py-1 pr-2">Exec</th>
                <th className="py-1 pr-2">Undo</th>
                <th className="py-1">Fail</th>
              </tr>
            </thead>
            <tbody>
              {summary.byActionType.map((row) => (
                <tr key={row.actionType} className="border-b border-slate-800/60">
                  <td className="py-1 pr-2 font-mono text-slate-300">{row.actionType}</td>
                  <td className="py-1 pr-2">{row.requestCount}</td>
                  <td className="py-1 pr-2">{row.approvalCount}</td>
                  <td className="py-1 pr-2">{row.executionCount}</td>
                  <td className="py-1 pr-2">{row.undoCount}</td>
                  <td className="py-1">{row.failureCount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}

      <p className="mt-3 text-[10px] text-slate-600">
        “Eligible for future review” does not enable new actions — it only flags healthy-enough signals for a later human
        decision.
      </p>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded border border-slate-800 bg-slate-950/50 px-2 py-1">
      <div className="text-slate-500">{label}</div>
      <div className="text-sm font-semibold text-slate-100">{value}</div>
    </div>
  );
}

function pct(x: number): string {
  return `${Math.round(x * 100)}%`;
}
