"use client";

import * as React from "react";

type Rec = { id: string; title: string; detail: string; severity: string };

export function GrowthActionsPanel() {
  const [recs, setRecs] = React.useState<Rec[] | null>(null);
  const [err, setErr] = React.useState<string | null>(null);

  React.useEffect(() => {
    void fetch("/api/growth/automation")
      .then((r) => r.json())
      .then((j) => {
        if (j.error) throw new Error(j.error);
        setRecs(j.recommendations ?? []);
      })
      .catch((e: Error) => setErr(e.message));
  }, []);

  if (err) return <p className="text-sm text-red-400">{err}</p>;
  if (!recs) return <p className="text-sm text-zinc-500">Loading recommendations…</p>;

  return (
    <div className="rounded-xl border border-amber-900/40 bg-amber-950/20 p-4">
      <h3 className="text-sm font-semibold text-amber-200/90">Recommended next actions (review-only)</h3>
      <p className="mt-1 text-xs text-amber-200/50">Nothing here auto-sends email or DMs.</p>
      <ul className="mt-4 space-y-3">
        {recs.map((r) => (
          <li
            key={r.id}
            className={`rounded-lg border px-3 py-2 text-sm ${
              r.severity === "warning"
                ? "border-amber-800/80 bg-amber-950/40 text-amber-100/90"
                : "border-zinc-800 bg-zinc-900/50 text-zinc-300"
            }`}
          >
            <p className="font-medium">{r.title}</p>
            <p className="mt-1 text-xs text-zinc-400">{r.detail}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
