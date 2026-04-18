"use client";

import * as React from "react";

type Rec = { id: string; title: string; detail: string; severity: string };

export function GrowthAutomationClient() {
  const [recs, setRecs] = React.useState<Rec[] | null>(null);
  const [err, setErr] = React.useState<string | null>(null);
  const [running, setRunning] = React.useState(false);

  const load = React.useCallback(() => {
    void fetch("/api/growth/automation")
      .then((r) => r.json())
      .then((j) => {
        if (j.error) throw new Error(j.error);
        setRecs(j.recommendations ?? []);
      })
      .catch((e: Error) => setErr(e.message));
  }, []);

  React.useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="space-y-4">
      <button
        type="button"
        disabled={running}
        onClick={() => {
          setRunning(true);
          void fetch("/api/growth/automation/run", { method: "POST" })
            .then((r) => r.json())
            .then((j) => {
              if (j.error) throw new Error(j.error);
              setRecs(j.recommendations ?? []);
            })
            .catch((e: Error) => setErr(e.message))
            .finally(() => setRunning(false));
        }}
        className="rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-200 hover:bg-zinc-800 disabled:opacity-50"
      >
        {running ? "Recomputing…" : "Recompute recommendations"}
      </button>
      {err ? <p className="text-sm text-red-400">{err}</p> : null}
      {!recs ? (
        <p className="text-sm text-zinc-500">Loading…</p>
      ) : (
        <ul className="space-y-3">
          {recs.map((r) => (
            <li key={r.id} className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-3 text-sm text-zinc-300">
              <p className="font-medium text-zinc-100">{r.title}</p>
              <p className="mt-1 text-xs text-zinc-500">{r.detail}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
