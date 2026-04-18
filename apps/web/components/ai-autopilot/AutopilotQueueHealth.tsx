"use client";

import * as React from "react";

type Health = {
  ok?: boolean;
  byStatus?: Record<string, number>;
  totalDuplicateRefreshes?: number;
  lastGuardrailSession?: {
    evaluated: number;
    rejected: number;
    byCode: Record<string, number>;
  };
  note?: string;
  error?: string;
};

/**
 * Admin-only: fetches `/api/admin/autopilot/queue-health` (requires admin session).
 */
export function AutopilotQueueHealth() {
  const [data, setData] = React.useState<Health | null>(null);
  const [err, setErr] = React.useState<string | null>(null);

  React.useEffect(() => {
    void fetch("/api/admin/autopilot/queue-health")
      .then(async (r) => {
        const j = (await r.json()) as Health;
        if (!r.ok) throw new Error(j.error ?? "queue health failed");
        setData(j);
      })
      .catch((e: Error) => setErr(e.message));
  }, []);

  if (err) {
    return <p className="text-sm text-red-400">Queue health: {err}</p>;
  }
  if (!data?.ok) {
    return <p className="text-sm text-zinc-500">Loading queue health…</p>;
  }

  return (
    <div className="rounded-xl border border-amber-900/40 bg-amber-950/20 p-4">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-amber-200/90">Internal — queue health</h2>
      {data.note && <p className="mt-1 text-xs text-zinc-500">{data.note}</p>}
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <div>
          <p className="text-xs text-zinc-500">Status distribution</p>
          <ul className="mt-1 space-y-0.5 text-sm text-zinc-300">
            {Object.entries(data.byStatus ?? {}).map(([k, v]) => (
              <li key={k}>
                {k}: {v}
              </li>
            ))}
          </ul>
        </div>
        <div>
          <p className="text-xs text-zinc-500">Dedupe / guardrails</p>
          <p className="mt-1 text-sm text-zinc-300">
            Total duplicate refreshes (counter sum):{" "}
            <span className="font-mono text-sky-200">{data.totalDuplicateRefreshes ?? 0}</span>
          </p>
          {data.lastGuardrailSession && (
            <ul className="mt-2 space-y-0.5 text-xs text-zinc-400">
              <li>Evaluated: {data.lastGuardrailSession.evaluated}</li>
              <li>Rejected: {data.lastGuardrailSession.rejected}</li>
              {Object.keys(data.lastGuardrailSession.byCode).length > 0 && (
                <li className="pt-1">
                  By code:{" "}
                  {Object.entries(data.lastGuardrailSession.byCode)
                    .map(([c, n]) => `${c}=${n}`)
                    .join(", ")}
                </li>
              )}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
