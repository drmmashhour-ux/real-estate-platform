"use client";

import * as React from "react";

import type {
  GrowthPolicyHistoryEntry,
  GrowthPolicyReviewDecision,
  GrowthPolicyReviewRecord,
} from "@/modules/growth/policy/growth-policy-history.types";

const DECISIONS: GrowthPolicyReviewDecision[] = [
  "acknowledged",
  "monitoring",
  "resolved",
  "recurring",
  "false_alarm",
];

export type GrowthPolicyReviewPanelProps = {
  entry: GrowthPolicyHistoryEntry | null;
  onSaved?: () => void;
};

export function GrowthPolicyReviewPanel({ entry, onSaved }: GrowthPolicyReviewPanelProps) {
  const [decision, setDecision] = React.useState<GrowthPolicyReviewDecision>("acknowledged");
  const [note, setNote] = React.useState("");
  const [reviewedBy, setReviewedBy] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const [msg, setMsg] = React.useState<string | null>(null);
  const [latest, setLatest] = React.useState<GrowthPolicyReviewRecord | null>(null);

  React.useEffect(() => {
    if (!entry) {
      setLatest(null);
      return;
    }
    let cancelled = false;
    const q = encodeURIComponent(entry.fingerprint);
    void fetch(`/api/growth/policy/reviews?fingerprint=${q}`, { credentials: "same-origin" })
      .then(async (r) => {
        const j = (await r.json()) as { reviews?: GrowthPolicyReviewRecord[]; error?: string };
        if (!r.ok) return;
        const top = j.reviews?.[0];
        if (!cancelled) setLatest(top ?? null);
      })
      .catch(() => {
        if (!cancelled) setLatest(null);
      });
    return () => {
      cancelled = true;
    };
  }, [entry?.fingerprint]);

  if (!entry) {
    return (
      <div className="rounded-lg border border-zinc-800 bg-zinc-950/40 px-3 py-2 text-[11px] text-zinc-500">
        Select a history row to add an operator review (human-entered only; does not clear live findings).
      </div>
    );
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    try {
      const r = await fetch("/api/growth/policy/review", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fingerprint: entry.fingerprint,
          policyId: entry.policyId,
          domain: entry.domain,
          title: entry.title,
          severity: entry.severity,
          reviewDecision: decision,
          note: note.trim() || undefined,
          reviewedBy: reviewedBy.trim() || undefined,
        }),
      });
      const j = (await r.json()) as { error?: string };
      if (!r.ok) throw new Error(j.error ?? "Failed");
      setMsg("Saved.");
      setNote("");
      onSaved?.();
    } catch (err: unknown) {
      setMsg(err instanceof Error ? err.message : "Failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded-xl border border-violet-900/35 bg-black/50 p-3">
      <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-violet-200/90">Operator review</p>
      <p className="mt-1 text-xs font-medium text-zinc-200">{entry.title}</p>
      <p className="mt-0.5 text-[10px] text-zinc-500">
        {entry.domain} · seen {entry.seenCount}× · {entry.currentStatus}
      </p>
      {latest ? (
        <p className="mt-1 text-[10px] text-zinc-400">
          Latest: <span className="text-zinc-300">{latest.reviewDecision}</span>
          {latest.note ? ` — ${latest.note}` : ""}
        </p>
      ) : (
        <p className="mt-1 text-[10px] text-zinc-500">No prior review logged for this fingerprint.</p>
      )}
      <p className="mt-2 text-[10px] leading-snug text-zinc-600">
        Saving stores intent only — it does not clear current policy warnings or attribute outcomes to prior navigation.
      </p>
      <form className="mt-3 space-y-2" onSubmit={onSubmit}>
        <label className="block text-[10px] text-zinc-500">
          Decision
          <select
            className="mt-1 w-full rounded border border-zinc-700 bg-zinc-950 px-2 py-1 text-xs text-zinc-200"
            value={decision}
            onChange={(e) => setDecision(e.target.value as GrowthPolicyReviewDecision)}
          >
            {DECISIONS.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-[10px] text-zinc-500">
          Note (optional)
          <textarea
            className="mt-1 w-full rounded border border-zinc-700 bg-zinc-950 px-2 py-1 text-xs text-zinc-200"
            rows={2}
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
        </label>
        <label className="block text-[10px] text-zinc-500">
          Reviewed by (optional)
          <input
            className="mt-1 w-full rounded border border-zinc-700 bg-zinc-950 px-2 py-1 text-xs text-zinc-200"
            value={reviewedBy}
            onChange={(e) => setReviewedBy(e.target.value)}
          />
        </label>
        <button
          type="submit"
          disabled={busy}
          className="rounded border border-violet-500/40 bg-violet-950/40 px-3 py-1 text-[11px] font-semibold text-violet-100 hover:bg-violet-950/60 disabled:opacity-50"
        >
          {busy ? "Saving…" : "Save review"}
        </button>
        {msg ? <p className="text-[10px] text-zinc-400">{msg}</p> : null}
      </form>
    </div>
  );
}
