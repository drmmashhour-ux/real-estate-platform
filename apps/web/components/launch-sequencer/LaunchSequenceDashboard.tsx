"use client";

import { useCallback, useState } from "react";
import type { LaunchSequencerOutput } from "@/modules/launch-sequencer/launch-sequencer.types";
import { LaunchPriorityTable } from "./LaunchPriorityTable";
import { LaunchDependenciesPanel } from "./LaunchDependenciesPanel";
import { LaunchFeatureSubsetCard } from "./LaunchFeatureSubsetCard";
import { LaunchRiskPanel } from "./LaunchRiskPanel";
import { LaunchModeBadge } from "./LaunchModeBadge";

export function LaunchSequenceDashboard(props: { initial: LaunchSequencerOutput }) {
  const [data, setData] = useState<LaunchSequencerOutput>(props.initial);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/launch-sequencer", { credentials: "include" });
      const j = (await res.json()) as { ok?: boolean; sequence?: LaunchSequencerOutput };
      if (res.ok && j.sequence) setData(j.sequence);
    } finally {
      setLoading(false);
    }
  }, []);

  const top = data.recommendations[0];

  return (
    <div className="mx-auto max-w-6xl space-y-8 px-4 py-10 text-[#f4efe4]">
      <header className="flex flex-col gap-4 border-b border-white/10 pb-6 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#D4AF37]/80">Planning only</p>
          <h1 className="mt-2 font-serif text-3xl">Launch Sequencer AI</h1>
          <p className="mt-2 max-w-2xl text-sm text-neutral-400">
            Scenario-based rollout ranking — not legal clearance, not market authorization. Conservative when data is incomplete. Does not
            bypass compliance or localization gates.
          </p>
          <p className="mt-2 text-xs text-neutral-500">{data.dataQualityNote}</p>
        </div>
        <button
          type="button"
          disabled={loading}
          onClick={() => void refresh()}
          className="rounded-lg border border-[#D4AF37]/40 bg-[#D4AF37]/10 px-4 py-2 text-sm font-medium text-[#f4efe4] hover:bg-[#D4AF37]/20 disabled:opacity-50"
        >
          {loading ? "Refreshing…" : "Refresh sequence"}
        </button>
      </header>

      <section className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-[#D4AF37]/90">Executive summary</h2>
        <ul className="mt-3 list-inside list-disc space-y-1 text-sm text-neutral-300">
          {data.summary.map((s, i) => (
            <li key={i}>{s}</li>
          ))}
        </ul>
        {data.topBlockers.length ? (
          <div className="mt-4">
            <p className="text-[10px] font-semibold uppercase text-rose-300/80">Top blockers (heuristic)</p>
            <ul className="mt-2 space-y-1 text-xs text-rose-200/80">
              {data.topBlockers.map((b, i) => (
                <li key={i}>{b}</li>
              ))}
            </ul>
          </div>
        ) : null}
      </section>

      <section className="space-y-3">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-neutral-500">Priority table</h2>
        <LaunchPriorityTable recommendations={data.recommendations} />
      </section>

      {top ?
        <section className="space-y-4">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
            Lead market detail · {top.marketKey}
          </h2>
          <div className="flex flex-wrap items-center gap-2">
            <LaunchModeBadge mode={top.launchMode} />
            <span className="text-xs text-neutral-500">
              Readiness {top.readiness.score}/100 · {top.readiness.label}
            </span>
          </div>
          <div className="grid gap-4 lg:grid-cols-2">
            <LaunchDependenciesPanel dependencies={top.dependencies} />
            <LaunchRiskPanel risk={top.riskProfile} />
          </div>
          <LaunchFeatureSubsetCard subset={top.featureSubset} />
          <div className="rounded-xl border border-white/10 bg-black/30 p-4 text-sm text-neutral-300">
            <p className="text-[10px] font-semibold uppercase text-neutral-500">Rationale</p>
            <ul className="mt-2 list-inside list-disc space-y-1 text-xs">
              {top.rationale.map((line, i) => (
                <li key={i}>{line}</li>
              ))}
            </ul>
          </div>
        </section>
      : null}

      <footer className="border-t border-white/10 pt-6 text-center text-xs text-neutral-600">
        Generated {new Date(data.generatedAt).toLocaleString()} · Logs tagged <code className="text-neutral-500">[launch-sequencer]</code>
      </footer>
    </div>
  );
}
