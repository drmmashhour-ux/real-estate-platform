"use client";

import * as React from "react";

export function AutopilotModeCard() {
  const [mode, setMode] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    void fetch("/api/autopilot/mode?scopeType=user")
      .then((r) => r.json())
      .then((j: { policy?: { mode?: string } | null }) => {
        setMode(j.policy?.mode ?? "ASSIST");
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <p className="text-xs text-zinc-500">Loading policy…</p>;
  }

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/30 p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Effective mode</p>
      <p className="mt-1 text-xl font-semibold text-white">{mode}</p>
      <p className="mt-2 text-xs text-zinc-500">
        Modes match BNHub <code className="text-zinc-400">AutopilotMode</code>: OFF · ASSIST · SAFE_AUTOPILOT · FULL_AUTOPILOT_APPROVAL. High-impact
        execution stays gated.
      </p>
    </div>
  );
}
