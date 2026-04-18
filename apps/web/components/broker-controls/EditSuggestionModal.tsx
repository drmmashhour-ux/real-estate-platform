"use client";

import { useState } from "react";

export function EditSuggestionModal({
  dealId,
  suggestionId,
  title,
  initialText,
  onClose,
  onRecorded,
}: {
  dealId: string;
  suggestionId: string;
  title: string;
  initialText: string;
  onClose: () => void;
  onRecorded?: () => void;
}) {
  const [text, setText] = useState(initialText);
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function recordEdit() {
    setLoading(true);
    setErr(null);
    try {
      const res = await fetch(`/api/deals/${dealId}/drafting/apply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "record_edit",
          suggestionId,
          editedSummary: text,
          note: note || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed");
      onRecorded?.();
      onClose();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-ds-border bg-ds-card p-5 shadow-ds-soft">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-ds-gold/90">Broker edit (audit only)</p>
        <h4 className="mt-1 font-medium text-ds-text">{title}</h4>
        <p className="mt-2 text-xs text-ds-text-secondary">
          Changes are logged — they do not auto-update executed OACIQ forms or third-party instruments.
        </p>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={8}
          className="mt-3 w-full rounded-xl border border-ds-border bg-black/40 px-3 py-2 text-sm text-ds-text"
        />
        <input
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Optional note (audit trail)"
          className="mt-2 w-full rounded-xl border border-ds-border bg-black/40 px-3 py-2 text-xs text-ds-text-secondary"
        />
        {err ? <p className="mt-2 text-xs text-red-400">{err}</p> : null}
        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            disabled={loading}
            onClick={() => void recordEdit()}
            className="rounded-xl bg-ds-gold/90 px-4 py-2 text-xs font-medium text-black hover:bg-ds-gold disabled:opacity-50"
          >
            {loading ? "Saving…" : "Record edit"}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-ds-border px-4 py-2 text-xs text-ds-text-secondary hover:bg-white/5"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
