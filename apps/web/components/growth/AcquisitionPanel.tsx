"use client";

import { useState } from "react";

type Target = {
  neighborhood: string;
  propertyType?: string | null;
  priceBand: string;
  opportunityScore: number;
  priority?: string;
};

export function AcquisitionPanel({
  snapshotGeneratedAt,
  targets,
  onRefresh,
}: {
  snapshotGeneratedAt: string | null;
  targets: Target[];
  onRefresh?: () => void;
}) {
  const [idx, setIdx] = useState(0);
  const [kind, setKind] = useState<"host" | "broker" | "seller">("host");
  const [loading, setLoading] = useState(false);
  const [draft, setDraft] = useState<unknown>(null);
  const [err, setErr] = useState<string | null>(null);

  async function generateDraft() {
    setLoading(true);
    setErr(null);
    try {
      const res = await fetch("/api/growth/supply/outreach-draft", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetIndex: idx, kind }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || res.statusText);
      setDraft(data);
    } catch (e) {
      setDraft(null);
      setErr(e instanceof Error ? e.message : "Request failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 className="text-sm font-semibold text-slate-200">Supply acquisition</h3>
          <p className="text-xs text-slate-500">
            Drafts only — review before any send (Law 25 / consent).
            {snapshotGeneratedAt ? ` Snapshot: ${snapshotGeneratedAt}` : ""}
          </p>
        </div>
        {onRefresh ? (
          <button
            type="button"
            onClick={onRefresh}
            className="rounded-lg border border-slate-700 px-3 py-1.5 text-xs text-slate-300 hover:bg-slate-800"
          >
            Refresh data
          </button>
        ) : null}
      </div>

      <div className="mb-3 flex flex-wrap gap-3">
        <label className="flex flex-col gap-1 text-xs text-slate-500">
          Target rank
          <select
            value={idx}
            onChange={(e) => setIdx(Number(e.target.value))}
            className="rounded border border-slate-700 bg-slate-950 px-2 py-1.5 text-sm text-slate-200"
          >
            {targets.map((t, i) => (
              <option key={i} value={i}>
                #{i + 1} {t.neighborhood} ({t.priority ?? "—"})
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-xs text-slate-500">
          Draft type
          <select
            value={kind}
            onChange={(e) => setKind(e.target.value as "host" | "broker" | "seller")}
            className="rounded border border-slate-700 bg-slate-950 px-2 py-1.5 text-sm text-slate-200"
          >
            <option value="host">Host (BNHub)</option>
            <option value="broker">Broker preview</option>
            <option value="seller">Seller pitch</option>
          </select>
        </label>
        <div className="flex items-end">
          <button
            type="button"
            disabled={loading || targets.length === 0}
            onClick={generateDraft}
            className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-500 disabled:opacity-50"
          >
            {loading ? "…" : "Generate draft"}
          </button>
        </div>
      </div>

      {err ? <p className="mb-2 text-sm text-red-400">{err}</p> : null}

      {draft ? (
        <pre className="max-h-64 overflow-auto rounded-lg border border-slate-800 bg-slate-950 p-3 text-xs text-slate-300">
          {JSON.stringify(draft, null, 2)}
        </pre>
      ) : (
        <p className="text-sm text-slate-500">Generate a reviewable draft for the selected target.</p>
      )}
    </div>
  );
}
