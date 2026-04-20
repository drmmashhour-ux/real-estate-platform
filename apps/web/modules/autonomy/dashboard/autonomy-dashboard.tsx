"use client";

import { useEffect, useState } from "react";

import DynamicPricingPanel from "./dynamic-pricing-panel";

type Snapshot = {
  health: unknown;
  learning: unknown;
  impact: unknown;
  pricing?: unknown[];
};

export default function AutonomyDashboard() {
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/autonomy/dashboard", { credentials: "same-origin" })
      .then(async (r) => {
        const data = await r.json();
        if (!r.ok) throw new Error(data?.error ?? `HTTP ${r.status}`);
        return data as Snapshot;
      })
      .then(setSnapshot)
      .catch(() => {
        setSnapshot(null);
        setError("Unable to load autonomy snapshot (flags or auth).");
      });
  }, []);

  return (
    <div className="mx-auto max-w-5xl space-y-8 p-6 text-zinc-100">
      <header className="space-y-1 border-b border-zinc-800 pb-6">
        <p className="text-xs uppercase tracking-[0.2em] text-amber-500/90">LECIPM Intelligence</p>
        <h1 className="text-2xl font-semibold tracking-tight">Autonomy control center</h1>
        <p className="max-w-2xl text-sm leading-relaxed text-zinc-400">
          Outcome-based self-improving engine — governed policies, explainable pricing factors, human gates for
          investment and high-impact moves. Not unrestricted ML.
        </p>
      </header>

      {!snapshot && !error ? (
        <p className="text-sm text-zinc-400">Loading snapshot…</p>
      ) : null}

      {error ? (
        <p className="rounded-lg border border-rose-900/40 bg-rose-950/30 px-4 py-3 text-sm text-rose-200">{error}</p>
      ) : null}

      {snapshot ? (
        <>
          <section className="grid gap-6 lg:grid-cols-2">
            <div className="rounded-xl border border-zinc-800/90 bg-zinc-950/40 p-4">
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-zinc-400">System health</h2>
              <pre className="max-h-64 overflow-auto text-xs leading-relaxed text-zinc-300">
                {JSON.stringify(snapshot.health, null, 2)}
              </pre>
            </div>
            <div className="rounded-xl border border-zinc-800/90 bg-zinc-950/40 p-4">
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-zinc-400">Outcome attribution</h2>
              <pre className="max-h-64 overflow-auto text-xs leading-relaxed text-zinc-300">
                {JSON.stringify(snapshot.impact, null, 2)}
              </pre>
            </div>
          </section>

          <section className="rounded-xl border border-zinc-800/90 bg-zinc-950/40 p-4">
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-zinc-400">Learning snapshot</h2>
            <pre className="max-h-48 overflow-auto text-xs leading-relaxed text-zinc-300">
              {JSON.stringify(snapshot.learning, null, 2)}
            </pre>
          </section>

          <DynamicPricingPanel />

          <section className="rounded-xl border border-zinc-800/90 bg-zinc-950/40 p-4">
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-zinc-400">
              Recent pricing rows (persisted)
            </h2>
            <pre className="max-h-48 overflow-auto text-xs leading-relaxed text-zinc-300">
              {JSON.stringify(snapshot.pricing ?? [], null, 2)}
            </pre>
          </section>
        </>
      ) : null}
    </div>
  );
}
