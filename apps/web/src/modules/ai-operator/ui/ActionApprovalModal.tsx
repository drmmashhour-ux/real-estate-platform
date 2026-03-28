"use client";

import { useState } from "react";

export type QueueActionRow = {
  id: string;
  type: string;
  context: string;
  status: string;
  confidenceScore: number;
  title: string;
  description: string;
  reason: string;
  dataUsedSummary: string | null;
  expectedOutcome: string | null;
  suggestedExecution: unknown;
  payload: unknown;
};

type Props = {
  action: QueueActionRow | null;
  open: boolean;
  onClose: () => void;
  onAfterChange: () => void;
};

export function ActionApprovalModal({ action, open, onClose, onAfterChange }: Props) {
  const [notes, setNotes] = useState("");
  const [editJson, setEditJson] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  if (!open || !action) return null;
  const row = action;

  async function postDecision(decision: "approve" | "reject") {
    setBusy(true);
    setErr(null);
    try {
      const res = await fetch(`/api/lecipm/ai-operator/actions/${row.id}/decision`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ decision, notes: notes || undefined }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Request failed");
      onAfterChange();
      onClose();
      setNotes("");
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Error");
    } finally {
      setBusy(false);
    }
  }

  async function saveEdit() {
    let parsed: Record<string, unknown>;
    try {
      parsed = editJson.trim() ? (JSON.parse(editJson) as Record<string, unknown>) : {};
    } catch {
      setErr("Invalid JSON for edited payload");
      return;
    }
    setBusy(true);
    setErr(null);
    try {
      const res = await fetch(`/api/lecipm/ai-operator/actions/${row.id}/decision`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ decision: "edit", editedPayload: parsed }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Request failed");
      onAfterChange();
      setEditJson("");
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Error");
    } finally {
      setBusy(false);
    }
  }

  async function runExecute() {
    setBusy(true);
    setErr(null);
    try {
      const res = await fetch(`/api/lecipm/ai-operator/actions/${row.id}/execute`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Execute failed");
      onAfterChange();
      onClose();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Error");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/75 p-4">
      <div
        role="dialog"
        aria-modal="true"
        className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-white/10 bg-[#0f1012] p-5 text-slate-100 shadow-2xl"
      >
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-premium-gold/90">AI Operator</p>
            <h2 className="mt-1 text-lg font-semibold text-white">{row.title}</h2>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg px-2 py-1 text-sm text-slate-400 hover:bg-white/5">
            ✕
          </button>
        </div>

        <p className="mt-3 text-sm text-slate-300">{row.description}</p>

        <div className="mt-4 space-y-2 rounded-xl border border-white/10 bg-black/30 p-3 text-xs">
          <p>
            <span className="font-semibold text-premium-gold">Why suggested</span>
            <span className="mt-1 block text-slate-400">{row.reason}</span>
          </p>
          {row.dataUsedSummary ? (
            <p>
              <span className="font-semibold text-slate-300">Data used</span>
              <span className="mt-1 block font-mono text-slate-500">{row.dataUsedSummary}</span>
            </p>
          ) : null}
          {row.expectedOutcome ? (
            <p>
              <span className="font-semibold text-slate-300">Expected outcome</span>
              <span className="mt-1 block text-slate-400">{row.expectedOutcome}</span>
            </p>
          ) : null}
          <p>
            <span className="font-semibold text-slate-300">Confidence</span>{" "}
            <span className="text-slate-400">{(row.confidenceScore * 100).toFixed(0)}%</span>
          </p>
          <p>
            <span className="font-semibold text-slate-300">Suggested execution</span>
            <pre className="mt-1 max-h-28 overflow-auto rounded bg-black/40 p-2 text-[10px] text-slate-500">
              {JSON.stringify(row.suggestedExecution, null, 2)}
            </pre>
          </p>
        </div>

        <p className="mt-3 text-[11px] text-amber-200/80">
          No auto messages or charges. Approve only if you accept the plan; execution logs hints — it does not send mail or post
          publicly.
        </p>

        {row.status === "approved" ? (
          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              disabled={busy}
              onClick={() => void runExecute()}
              className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-500 disabled:opacity-50"
            >
              Run execution
            </button>
          </div>
        ) : (
          <>
            <label className="mt-4 block text-xs text-slate-400">
              Reject notes (optional)
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="mt-1 w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-white"
                rows={2}
              />
            </label>
            <label className="mt-3 block text-xs text-slate-400">
              Edit payload (JSON, optional — then approve separately)
              <textarea
                value={editJson}
                onChange={(e) => setEditJson(e.target.value)}
                placeholder='{"note":"..."}'
                className="mt-1 w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 font-mono text-[11px] text-white"
                rows={3}
              />
            </label>
            <div className="mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                disabled={busy}
                onClick={() => void postDecision("approve")}
                className="rounded-lg bg-premium-gold px-4 py-2 text-sm font-semibold text-black hover:bg-[#d4b456] disabled:opacity-50"
              >
                Approve
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() => void postDecision("reject")}
                className="rounded-lg border border-white/15 px-4 py-2 text-sm text-slate-200 hover:bg-white/5 disabled:opacity-50"
              >
                Reject
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() => void saveEdit()}
                className="rounded-lg border border-white/15 px-4 py-2 text-sm text-slate-200 hover:bg-white/5 disabled:opacity-50"
              >
                Save edit
              </button>
            </div>
          </>
        )}

        {err ? <p className="mt-2 text-xs text-red-400">{err}</p> : null}
      </div>
    </div>
  );
}
