"use client";

import { useState } from "react";

type Kind = "document" | "workflow";

type Props = {
  open: boolean;
  kind: Kind;
  title: string;
  onClose: () => void;
  onConfirm: (payload: { decision: "approve" | "reject"; reason?: string }) => Promise<void>;
};

export function LegalReviewDecisionModal({ open, kind, title, onClose, onConfirm }: Props) {
  const [decision, setDecision] = useState<"approve" | "reject">("approve");
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!open) return null;

  async function submit() {
    setError(null);
    if (decision === "reject" && !reason.trim()) {
      setError("Reason is required for rejection.");
      return;
    }
    setBusy(true);
    try {
      await onConfirm({
        decision,
        reason: decision === "reject" ? reason.trim() : undefined,
      });
      setReason("");
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Action failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 py-8">
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl border border-slate-700 bg-slate-950 p-5 shadow-xl">
        <h3 className="text-sm font-semibold text-slate-100">{title}</h3>
        <p className="mt-1 text-xs text-slate-500">
          {kind === "workflow" ?
            "Approving or rejecting a workflow applies the same bundle decision to linked checklist documents."
          : "Single-document review."}{" "}
          Not legal advice.
        </p>
        <div className="mt-4 flex gap-3">
          <label className="flex items-center gap-2 text-xs text-slate-300">
            <input
              type="radio"
              name="decision"
              checked={decision === "approve"}
              onChange={() => setDecision("approve")}
            />
            Approve
          </label>
          <label className="flex items-center gap-2 text-xs text-slate-300">
            <input
              type="radio"
              name="decision"
              checked={decision === "reject"}
              onChange={() => setDecision("reject")}
            />
            Reject
          </label>
        </div>
        <label className="mt-4 block text-xs text-slate-400">
          Reason {decision === "reject" ? "(required)" : "(optional)"}
          <textarea
            className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100"
            rows={3}
            value={reason}
            onChange={(ev) => setReason(ev.target.value)}
          />
        </label>
        {error ? <p className="mt-2 text-xs text-red-400">{error}</p> : null}
        <div className="mt-4 flex justify-end gap-2">
          <button
            type="button"
            className="rounded-lg px-3 py-2 text-xs font-medium text-slate-400 hover:bg-slate-900"
            onClick={() => !busy && onClose()}
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={busy}
            className="rounded-lg bg-emerald-600 px-4 py-2 text-xs font-semibold text-white disabled:opacity-50"
            onClick={() => void submit()}
          >
            {busy ? "Saving…" : "Confirm"}
          </button>
        </div>
      </div>
    </div>
  );
}
