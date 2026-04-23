"use client";

import { useEffect, useMemo, useState } from "react";
import type { WorkflowClientDto } from "@/lib/workflows/dto";

function stepsNeedDraftConfirmation(steps: unknown): boolean {
  if (!Array.isArray(steps)) return false;
  return steps.some((s) => {
    const o = s as { type?: string };
    return o.type === "draft_contract";
  });
}

type Props = {
  initial: WorkflowClientDto;
};

export default function WorkflowCard({ initial }: Props) {
  const [wf, setWf] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [regulatedConfirmed, setRegulatedConfirmed] = useState(false);

  useEffect(() => {
    setWf(initial);
    setErr(null);
    setRegulatedConfirmed(false);
  }, [initial.id]);

  const needsDraftConfirm = useMemo(
    () => wf.type === "draft_contract" || stepsNeedDraftConfirmation(wf.steps),
    [wf.type, wf.steps],
  );

  async function postApprove() {
    setBusy(true);
    setErr(null);
    try {
      const res = await fetch("/api/workflows/approve", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workflowId: wf.id }),
      });
      const j = (await res.json()) as { success?: boolean; workflow?: WorkflowClientDto; error?: string };
      if (!res.ok || !j.workflow) {
        setErr(j.error ?? "Approve failed");
        return;
      }
      setWf(j.workflow);
    } catch {
      setErr("Network error");
    } finally {
      setBusy(false);
    }
  }

  async function postExecute() {
    if (needsDraftConfirm && !regulatedConfirmed) {
      setErr("Confirm the advisory-only notice before running contract-related workflows.");
      return;
    }
    setBusy(true);
    setErr(null);
    try {
      const res = await fetch("/api/workflows/execute", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workflowId: wf.id,
          regulatedConfirmed: needsDraftConfirm ? regulatedConfirmed : undefined,
        }),
      });
      const j = (await res.json()) as { success?: boolean; workflow?: WorkflowClientDto | null; error?: string };
      if (!res.ok || !j.workflow) {
        setErr(j.error ?? "Execute failed");
        return;
      }
      setWf(j.workflow);
    } catch {
      setErr("Network error");
    } finally {
      setBusy(false);
    }
  }

  const showApprove = wf.requiresApproval && wf.status === "proposed";
  const showRun = !wf.requiresApproval && wf.status === "proposed";
  const showExecuteApproved = wf.requiresApproval && wf.status === "approved";
  const actionable = wf.status !== "completed" && wf.status !== "failed" && wf.status !== "executing";

  return (
    <div className="mt-4 space-y-3 rounded-xl border border-ds-border bg-ds-card/90 p-4 text-sm text-ds-text shadow-ds-soft">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-ds-gold">AI workflow</p>
      <div className="font-semibold text-ds-text">{wf.title}</div>
      {wf.description ? <p className="text-xs text-ds-text-secondary">{wf.description}</p> : null}
      <p className="text-xs text-ds-text-secondary">
        Steps: {Array.isArray(wf.steps) ? wf.steps.length : 0} · Status:{" "}
        <span className="text-ds-text">{wf.status}</span>
      </p>

      {needsDraftConfirm && (showApprove || showExecute) ? (
        <label className="flex cursor-pointer items-start gap-2 text-xs text-amber-200/90">
          <input
            type="checkbox"
            className="mt-0.5"
            checked={regulatedConfirmed}
            onChange={(e) => setRegulatedConfirmed(e.target.checked)}
          />
          <span>I understand contract steps are advisory only and not a substitute for legal counsel.</span>
        </label>
      ) : null}

      {err ? <p className="text-xs text-red-400/95">{err}</p> : null}

      <div className="flex flex-wrap gap-2 pt-1">
        {showApprove ? (
          <button
            type="button"
            disabled={busy}
            onClick={() => void postApprove()}
            className="rounded-lg bg-ds-gold px-4 py-2 text-xs font-medium text-black disabled:opacity-50"
          >
            Approve
          </button>
        ) : null}
        {actionable && showRun ? (
          <button
            type="button"
            disabled={busy}
            onClick={() => void postExecute()}
            className="rounded-lg bg-emerald-600 px-4 py-2 text-xs font-medium text-white disabled:opacity-50"
          >
            Run
          </button>
        ) : null}
        {actionable && showExecuteApproved ? (
          <button
            type="button"
            disabled={busy}
            onClick={() => void postExecute()}
            className="rounded-lg bg-emerald-600 px-4 py-2 text-xs font-medium text-white disabled:opacity-50"
          >
            Execute
          </button>
        ) : null}
      </div>

      {wf.status === "completed" ? <p className="text-xs font-medium text-emerald-400/95">Completed</p> : null}
      {wf.status === "failed" ? <p className="text-xs font-medium text-red-400/95">Failed — check execution logs.</p> : null}
    </div>
  );
}
