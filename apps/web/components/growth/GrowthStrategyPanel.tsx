"use client";

import * as React from "react";
import type {
  GrowthStrategyPlanStatus,
  GrowthStrategyPriority,
  GrowthStrategyExperiment,
  GrowthStrategyRoadmapItem,
} from "@/modules/growth/growth-strategy.types";
import type { GrowthPolicyEnforcementSnapshot } from "@/modules/growth/growth-policy-enforcement.types";
import { getEnforcementForTarget } from "@/modules/growth/growth-policy-enforcement-query.service";

function statusBadgeClass(s: GrowthStrategyPlanStatus): string {
  if (s === "strong") return "border-emerald-500/50 bg-emerald-950/40 text-emerald-200";
  if (s === "healthy") return "border-sky-500/40 bg-sky-950/30 text-sky-100";
  if (s === "watch") return "border-amber-500/40 bg-amber-950/35 text-amber-100";
  return "border-rose-500/40 bg-rose-950/30 text-rose-100";
}

const THEME_BADGE_CLASS =
  "rounded border border-zinc-600 bg-zinc-800/80 px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-zinc-400";

export function GrowthStrategyPanel({
  experimentsEnabled,
  roadmapEnabled,
  enforcementSnapshot,
}: {
  experimentsEnabled: boolean;
  roadmapEnabled: boolean;
  enforcementSnapshot?: GrowthPolicyEnforcementSnapshot | null;
}) {
  const [loading, setLoading] = React.useState(true);
  const [err, setErr] = React.useState<string | null>(null);
  const [status, setStatus] = React.useState<GrowthStrategyPlanStatus | null>(null);
  const [topPriority, setTopPriority] = React.useState<string | undefined>();
  const [priorities, setPriorities] = React.useState<GrowthStrategyPriority[]>([]);
  const [experiments, setExperiments] = React.useState<GrowthStrategyExperiment[]>([]);
  const [roadmap, setRoadmap] = React.useState<GrowthStrategyRoadmapItem[]>([]);
  const [blockers, setBlockers] = React.useState<string[]>([]);

  React.useEffect(() => {
    let cancelled = false;
    void fetch("/api/growth/strategy", { credentials: "same-origin" })
      .then(async (r) => {
        const j = (await r.json()) as { error?: string; bundle?: { weeklyPlan: { status: GrowthStrategyPlanStatus; topPriority?: string; priorities: GrowthStrategyPriority[]; experiments: GrowthStrategyExperiment[]; roadmap: GrowthStrategyRoadmapItem[]; blockers: string[] } } };
        if (!r.ok) throw new Error(j.error ?? "Strategy unavailable");
        return j.bundle;
      })
      .then((bundle) => {
        if (cancelled || !bundle) return;
        const p = bundle.weeklyPlan;
        setStatus(p.status);
        setTopPriority(p.topPriority);
        setPriorities(p.priorities);
        setExperiments(experimentsEnabled ? p.experiments : []);
        setRoadmap(roadmapEnabled ? p.roadmap : []);
        setBlockers(p.blockers);
        setLoading(false);
      })
      .catch((e: Error) => {
        if (!cancelled) {
          setErr(e.message);
          setLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [experimentsEnabled, roadmapEnabled]);

  const stratEnf = enforcementSnapshot
    ? getEnforcementForTarget("strategy_recommendation_promotion", enforcementSnapshot)
    : null;

  if (loading) {
    return <p className="text-sm text-zinc-500">Loading growth strategy…</p>;
  }
  if (err) {
    return <p className="text-sm text-red-400">{err}</p>;
  }

  return (
    <div className="rounded-xl border border-violet-900/40 bg-violet-950/20 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-sm font-semibold text-violet-100">
          <span aria-hidden>🧭</span> Growth Strategy
        </h3>
        {status ? (
          <span className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide ${statusBadgeClass(status)}`}>
            {status}
          </span>
        ) : null}
      </div>
      <p className="mt-1 text-xs text-zinc-500">
        Advisory plan only — review before acting. No auto-execution.
      </p>
      {stratEnf && stratEnf.mode !== "allow" ? (
        <p className="mt-2 text-[11px] text-amber-200/85">
          Policy: strategy recommendations are not auto-promoted ({stratEnf.mode}).
        </p>
      ) : null}

      {topPriority ? (
        <p className="mt-3 text-sm text-zinc-200">
          <span className="text-zinc-500" aria-hidden>
            🎯{" "}
          </span>
          <span className="font-medium text-violet-100">{topPriority}</span>
        </p>
      ) : null}

      <div className="mt-4 space-y-3">
        <h4 className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Weekly priorities</h4>
        <ul className="space-y-2">
          {priorities.slice(0, 5).map((pr) => (
            <li key={pr.id} className="rounded-lg border border-zinc-800/90 bg-black/20 px-3 py-2 text-sm">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-medium text-zinc-100">{pr.title}</span>
                <span className={THEME_BADGE_CLASS}>{pr.theme.replace(/_/g, " ")}</span>
              </div>
              <p className="mt-1 text-xs text-zinc-500">
                Impact: {pr.impact} · Confidence: {(pr.confidence * 100).toFixed(0)}%
              </p>
              <p className="mt-1 text-xs text-zinc-400">{pr.why}</p>
            </li>
          ))}
        </ul>
      </div>

      {experimentsEnabled && experiments.length > 0 ? (
        <div className="mt-4 space-y-2">
          <h4 className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Experiments (manual)</h4>
          <ul className="space-y-2 text-sm">
            {experiments.map((ex) => (
              <li key={ex.id} className="rounded-lg border border-zinc-800/80 bg-zinc-900/40 px-3 py-2">
                <p className="font-medium text-zinc-200">{ex.title}</p>
                <p className="mt-0.5 text-xs text-zinc-500">{ex.hypothesis}</p>
                <p className="mt-1 text-xs text-zinc-400">Metric: {ex.successMetric}</p>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {roadmapEnabled && roadmap.length > 0 ? (
        <div className="mt-4 space-y-2">
          <h4 className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Roadmap themes</h4>
          <ul className="space-y-1.5 text-sm text-zinc-300">
            {roadmap.slice(0, 6).map((r) => (
              <li key={r.id} className="flex flex-wrap items-baseline gap-2">
                <span className="rounded border border-zinc-700 px-1.5 py-0.5 text-[10px] uppercase text-zinc-500">
                  {r.horizon.replace(/_/g, " ")}
                </span>
                <span>{r.title}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {blockers.length > 0 ? (
        <div className="mt-4">
          <h4 className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Blockers</h4>
          <ul className="mt-1 list-inside list-disc text-xs text-amber-200/90">
            {blockers.slice(0, 6).map((b, i) => (
              <li key={i}>{b}</li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
