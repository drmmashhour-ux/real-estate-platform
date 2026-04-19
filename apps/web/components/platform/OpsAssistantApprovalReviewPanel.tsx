"use client";

import { useCallback, useState } from "react";

import type { ApprovalExecutionOutcomeSummary } from "@/modules/platform/ops-assistant/approval-execution-results.types";
import {
  GOVERNANCE_EXPANSION_GATE_MESSAGE,
  GOVERNANCE_NO_AUTO_EXPANSION_MESSAGE,
} from "@/modules/platform/ops-assistant/approval-execution-review.types";
import type {
  ApprovalExecutionReviewRecord,
  ApprovalExecutionReviewSummary,
} from "@/modules/platform/ops-assistant/approval-execution-review.types";

type EvidenceRow = {
  row?: {
    requestCount: number;
    approvalCount: number;
    executionCount: number;
    undoCount: number;
    failureCount: number;
  };
};

function parseEvidence(raw: string): EvidenceRow {
  try {
    return JSON.parse(raw) as EvidenceRow;
  } catch {
    return {};
  }
}

export function OpsAssistantApprovalReviewPanel({
  initialOutcomeSummary,
  initialRecords,
  initialReviewSummary,
  mutationsEnabled,
}: {
  initialOutcomeSummary: ApprovalExecutionOutcomeSummary;
  initialRecords: ApprovalExecutionReviewRecord[];
  initialReviewSummary: ApprovalExecutionReviewSummary;
  mutationsEnabled: boolean;
}) {
  const [records, setRecords] = useState(initialRecords);
  const [reviewSummary, setReviewSummary] = useState(initialReviewSummary);
  const [outcomeSummary, setOutcomeSummary] = useState(initialOutcomeSummary);
  const [busy, setBusy] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [notesById, setNotesById] = useState<Record<string, string>>({});

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/platform/ops-assistant/governance/review");
      const json = (await res.json()) as {
        records?: ApprovalExecutionReviewRecord[];
        reviewSummary?: ApprovalExecutionReviewSummary;
        outcomeSummary?: ApprovalExecutionOutcomeSummary;
      };
      if (json.records) setRecords(json.records);
      if (json.reviewSummary) setReviewSummary(json.reviewSummary);
      if (json.outcomeSummary) setOutcomeSummary(json.outcomeSummary);
    } catch {
      /* ignore */
    }
  }, []);

  const submit = async (recordId: string, decision: "keep" | "hold" | "rollback" | "future_review") => {
    setBusy(recordId + decision);
    setMsg(null);
    try {
      const res = await fetch("/api/platform/ops-assistant/governance/review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recordId,
          decision,
          notes: notesById[recordId] ?? "",
        }),
      });
      const json = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setMsg(json.error ?? "Update failed");
        return;
      }
      setMsg("Governance decision saved.");
      await refresh();
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="rounded-lg border border-fuchsia-900/40 bg-fuchsia-950/15 p-4">
      <h2 className="text-xs font-semibold uppercase tracking-wide text-fuchsia-300">Manual governance review</h2>
      <p className="mt-1 text-[11px] text-slate-500">
        Human decisions only. Nothing here enables new executable actions or autonomy — it records posture for engineering
        policy.
      </p>

      <p className="mt-2 rounded border border-amber-900/40 bg-amber-950/20 px-2 py-1.5 text-[11px] text-amber-100">
        {GOVERNANCE_EXPANSION_GATE_MESSAGE}
      </p>
      <p className="mt-1 text-[10px] text-slate-500">{GOVERNANCE_NO_AUTO_EXPANSION_MESSAGE}</p>

      {reviewSummary.governanceRollbackActive ? (
        <p className="mt-2 rounded border border-rose-900/50 bg-rose-950/30 px-2 py-1.5 text-[11px] text-rose-100">
          Governance rollback flag is active — treat current execution scope as rollback candidate; prefer kill switch /
          policy review before relying on approvals. Audit history is retained.
        </p>
      ) : null}

      <div className="mt-3 grid grid-cols-2 gap-2 text-[11px] sm:grid-cols-4">
        <Stat label="Pending" value={reviewSummary.pendingCount} />
        <Stat label="Reviewed" value={reviewSummary.reviewedCount} />
        <Stat label="Results exist" value={reviewSummary.resultsExist ? "yes" : "no"} />
        <Stat
          label="Expansion path cleared"
          value={reviewSummary.expansionConsiderationPathCleared ? "yes (review only)" : "no"}
        />
      </div>

      <p className="mt-2 text-[10px] text-slate-500">
        “Expansion path cleared” means humans marked every allowlisted action row and at least one as future review — it
        still does <span className="text-slate-400">not</span> ship new execution kinds.
      </p>

      <dl className="mt-2 space-y-1 text-[11px] text-slate-400">
        <div>
          <dt className="inline text-slate-500">Measured outcome · </dt>
          <dd className="inline text-slate-200">{outcomeSummary.finalDecision.replace(/_/g, " ")}</dd>
        </div>
        <div>
          <dt className="inline text-slate-500">Safety / usefulness · </dt>
          <dd className="inline text-slate-200">
            {outcomeSummary.safetyEvaluation} / {outcomeSummary.usefulnessEvaluation}
          </dd>
        </div>
      </dl>

      {msg ? <p className="mt-2 text-xs text-emerald-400">{msg}</p> : null}

      <div className="mt-4 space-y-3">
        {records.map((r) => {
          const ev = parseEvidence(r.evidenceSummary);
          const row = ev.row;
          return (
            <div key={r.id} className="rounded border border-slate-800 bg-slate-950/40 p-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="font-mono text-xs text-fuchsia-200">{r.actionType}</span>
                <span className="text-[10px] uppercase text-slate-500">{r.status.replace(/_/g, " ")}</span>
              </div>
              <p className="mt-1 text-[10px] text-slate-500">
                Measured decision (context): <span className="text-slate-400">{r.measuredDecision.replace(/_/g, " ")}</span>
              </p>
              <p className="mt-1 text-[10px] text-slate-500">
                Safety / usefulness snapshot: {r.safetySummary} / {r.usefulnessSummary}
              </p>
              {row ? (
                <p className="mt-1 text-[10px] text-slate-400">
                  req {row.requestCount} · appr {row.approvalCount} · exec {row.executionCount} · undo {row.undoCount} · fail{" "}
                  {row.failureCount}
                </p>
              ) : null}

              <label className="mt-2 block text-[10px] text-slate-500" htmlFor={`gov-note-${r.id}`}>
                Notes (optional)
              </label>
              <textarea
                id={`gov-note-${r.id}`}
                className="mt-0.5 min-h-[52px] w-full rounded border border-slate-700 bg-slate-900 px-2 py-1 text-[11px] text-slate-100"
                value={notesById[r.id] ?? ""}
                disabled={r.status !== "pending_review" || !mutationsEnabled}
                onChange={(e) => setNotesById((m) => ({ ...m, [r.id]: e.target.value }))}
              />

              {r.status === "pending_review" ? (
                <div className="mt-2 flex flex-wrap gap-2">
                  <GovBtn
                    label="Keep current scope"
                    disabled={Boolean(busy) || !mutationsEnabled}
                    onClick={() => void submit(r.id, "keep")}
                  />
                  <GovBtn
                    label="Hold"
                    disabled={Boolean(busy) || !mutationsEnabled}
                    onClick={() => void submit(r.id, "hold")}
                  />
                  <GovBtn
                    label="Roll back"
                    disabled={Boolean(busy) || !mutationsEnabled}
                    onClick={() => void submit(r.id, "rollback")}
                  />
                  <GovBtn
                    label="Eligible for future review"
                    disabled={Boolean(busy) || !mutationsEnabled}
                    onClick={() => void submit(r.id, "future_review")}
                  />
                </div>
              ) : (
                <p className="mt-2 text-[10px] text-slate-500">
                  Decision ·{" "}
                  <span className="text-slate-300">{r.reviewedDecision?.replace(/_/g, " ") ?? r.status.replace(/_/g, " ")}</span>
                  {" · "}
                  Reviewed {r.reviewedAt ? new Date(r.reviewedAt).toLocaleString() : "—"} · by{" "}
                  {r.reviewedBy ? `${r.reviewedBy.slice(0, 12)}…` : "—"}
                  {r.notes ? (
                    <>
                      {" "}
                      — <span className="text-slate-400">{r.notes}</span>
                    </>
                  ) : null}
                </p>
              )}
            </div>
          );
        })}
      </div>

      <button
        type="button"
        className="mt-3 text-[10px] text-fuchsia-400 underline decoration-fuchsia-800 hover:text-fuchsia-300"
        onClick={() => void refresh()}
      >
        Refresh governance state
      </button>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded border border-slate-800 bg-slate-950/50 px-2 py-1">
      <div className="text-slate-500">{label}</div>
      <div className="text-sm font-semibold text-slate-100">{value}</div>
    </div>
  );
}

function GovBtn({
  label,
  onClick,
  disabled,
}: {
  label: string;
  onClick: () => void;
  disabled: boolean;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      className="rounded border border-fuchsia-800/60 bg-fuchsia-950/40 px-2 py-1 text-[10px] text-fuchsia-100 hover:bg-fuchsia-900/40 disabled:opacity-40"
      onClick={onClick}
    >
      {label}
    </button>
  );
}
