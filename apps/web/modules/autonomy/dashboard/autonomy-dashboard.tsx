"use client";

import { useEffect, useState } from "react";

import DynamicPricingPanel from "./dynamic-pricing-panel";

type LearningSnap = {
  successRate?: number;
  positiveOutcomes?: number;
  negativeOutcomes?: number;
  totalActions?: number;
  modelVersion?: string;
};

type ImpactSnap = {
  revenueDelta?: number;
  occupancyDelta?: number;
  riskReduction?: number;
  totalEvents?: number;
};

type HealthSnap = {
  mode?: string;
  isPaused?: boolean;
  pendingApprovals?: number;
  executedToday?: number;
  rolledBackToday?: number;
  criticalPolicyEvents?: number;
  recommendedPause?: boolean;
  activeDomains?: string[];
};

type Snapshot = {
  health: HealthSnap;
  learning: LearningSnap;
  impact: ImpactSnap;
  pricing?: unknown[];
  policyMonitoring?: { evaluationsCount: number; criticalCount: number };
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

  const h = snapshot?.health;
  const learn = snapshot?.learning;
  const impact = snapshot?.impact;
  const pm = snapshot?.policyMonitoring;

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

      {h?.recommendedPause ? (
        <div className="rounded-xl border border-amber-700/40 bg-amber-950/25 px-4 py-3 text-sm text-amber-100">
          <strong className="font-semibold">Recommended pause:</strong> recent negative outcomes exceed positive in the
          trailing window — review before scaling autonomy.
        </div>
      ) : null}

      {snapshot ? (
        <>
          <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <MetricCard label="Mode" value={h?.mode ?? "—"} />
            <MetricCard label="Paused" value={h?.isPaused ? "Yes" : "No"} accent={h?.isPaused ? "warn" : "ok"} />
            <MetricCard label="Pending approvals" value={String(h?.pendingApprovals ?? 0)} />
            <MetricCard label="Executed today / rollbacks" value={`${h?.executedToday ?? 0} / ${h?.rolledBackToday ?? 0}`} />
          </section>

          <section className="grid gap-4 md:grid-cols-3">
            <div className="rounded-xl border border-zinc-800/90 bg-zinc-950/40 p-4">
              <h2 className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Learning (outcome-based)</h2>
              <p className="mt-2 text-3xl font-semibold tabular-nums text-zinc-100">
                {pct(learn?.successRate)} <span className="text-sm font-normal text-zinc-500">success rate</span>
              </p>
              <p className="mt-1 text-xs text-zinc-500">
                +{learn?.positiveOutcomes ?? 0} / −{learn?.negativeOutcomes ?? 0} · {learn?.modelVersion ?? "—"}
              </p>
            </div>
            <div className="rounded-xl border border-zinc-800/90 bg-zinc-950/40 p-4">
              <h2 className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Impact (attributed deltas)</h2>
              <p className="mt-2 text-sm leading-relaxed text-zinc-300">
                Revenue Δ <span className="font-mono text-amber-200/90">{impact?.revenueDelta ?? 0}</span>
                <br />
                Occupancy Δ <span className="font-mono text-zinc-200">{impact?.occupancyDelta ?? 0}</span>
                <br />
                Risk reduction Σ <span className="font-mono text-zinc-200">{impact?.riskReduction ?? 0}</span>
              </p>
              <p className="mt-2 text-xs text-zinc-500">{impact?.totalEvents ?? 0} outcome events</p>
            </div>
            <div className="rounded-xl border border-zinc-800/90 bg-zinc-950/40 p-4">
              <h2 className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Policy monitoring</h2>
              <p className="mt-2 text-3xl font-semibold tabular-nums text-zinc-100">{pm?.evaluationsCount ?? 0}</p>
              <p className="mt-1 text-xs text-zinc-500">
                Critical / blocked triggers:{" "}
                <span className="font-mono text-rose-300/90">{pm?.criticalCount ?? 0}</span>
              </p>
            </div>
          </section>

          <section className="grid gap-6 lg:grid-cols-2">
            <div className="rounded-xl border border-zinc-800/90 bg-zinc-950/40 p-4">
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-zinc-400">System health (raw)</h2>
              <pre className="max-h-56 overflow-auto text-xs leading-relaxed text-zinc-300">
                {JSON.stringify(snapshot.health, null, 2)}
              </pre>
            </div>
            <div className="rounded-xl border border-zinc-800/90 bg-zinc-950/40 p-4">
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-zinc-400">Active domains</h2>
              <ul className="flex flex-wrap gap-2">
                {(h?.activeDomains ?? []).map((d) => (
                  <li key={d} className="rounded-full border border-zinc-700 bg-black/30 px-3 py-1 text-xs text-zinc-300">
                    {d}
                  </li>
                ))}
              </ul>
              <h3 className="mt-4 text-xs uppercase tracking-wide text-zinc-500">Learning snapshot</h3>
              <pre className="mt-2 max-h-40 overflow-auto text-xs leading-relaxed text-zinc-300">
                {JSON.stringify(snapshot.learning, null, 2)}
              </pre>
            </div>
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

function pct(rate: number | undefined) {
  if (rate === undefined || Number.isNaN(rate)) return "—";
  return `${Math.round(rate * 100)}%`;
}

function MetricCard({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: "ok" | "warn";
}) {
  return (
    <div
      className={`rounded-xl border px-4 py-3 ${
        accent === "warn"
          ? "border-amber-800/50 bg-amber-950/20"
          : "border-zinc-800/90 bg-zinc-950/40"
      }`}
    >
      <div className="text-[10px] uppercase tracking-wide text-zinc-500">{label}</div>
      <div className="mt-1 font-semibold text-zinc-100">{value}</div>
    </div>
  );
}
