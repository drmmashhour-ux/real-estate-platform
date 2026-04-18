"use client";

import * as React from "react";
import type { GrowthSimulationBundle, GrowthSimulationResult } from "@/modules/growth/growth-simulation.types";
import type { GrowthPolicyEnforcementSnapshot } from "@/modules/growth/growth-policy-enforcement.types";
import { getEnforcementForTarget } from "@/modules/growth/growth-policy-enforcement-query.service";

function recBadge(r: GrowthSimulationResult["recommendation"]): string {
  if (r === "consider") return "border-emerald-500/50 bg-emerald-950/35 text-emerald-100";
  if (r === "caution") return "border-amber-500/45 bg-amber-950/30 text-amber-100";
  return "border-slate-600 bg-slate-900/60 text-slate-400";
}

export function GrowthSimulationPanel({
  enforcementSnapshot,
}: {
  enforcementSnapshot?: GrowthPolicyEnforcementSnapshot | null;
}) {
  const [bundle, setBundle] = React.useState<GrowthSimulationBundle | null>(null);
  const [err, setErr] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    let cancelled = false;
    void fetch("/api/growth/simulation", { credentials: "same-origin" })
      .then(async (r) => {
        const j = (await r.json()) as { error?: string; bundle?: GrowthSimulationBundle };
        if (!r.ok) throw new Error(j.error ?? "Simulation unavailable");
        return j.bundle ?? null;
      })
      .then((b) => {
        if (!cancelled) {
          setBundle(b);
          setLoading(false);
        }
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
  }, []);

  if (loading) {
    return <p className="text-sm text-zinc-500">Loading growth simulations…</p>;
  }
  if (err) {
    return <p className="text-sm text-red-400">{err}</p>;
  }
  if (!bundle) {
    return null;
  }

  const b = bundle.baselineSummary;
  const simEnf = enforcementSnapshot
    ? getEnforcementForTarget("simulation_recommendation_promotion", enforcementSnapshot)
    : null;

  return (
    <div className="rounded-xl border border-fuchsia-900/35 bg-fuchsia-950/15 p-4">
      <h3 className="text-sm font-semibold text-fuchsia-100">
        <span aria-hidden>🔮</span> Growth Simulations
      </h3>
      {simEnf && simEnf.mode !== "allow" ? (
        <p className="mt-1 text-[11px] text-amber-200/90">
          Policy: simulation recommendations are not auto-promoted ({simEnf.mode}).
        </p>
      ) : null}
      <p className="mt-1 text-xs text-zinc-500">
        Simulation only — estimates for planning, not guaranteed outcomes.
      </p>

      <div className="mt-3 rounded-lg border border-zinc-800 bg-zinc-950/50 p-3 text-xs text-zinc-400">
        <p className="font-medium text-zinc-300">Baseline (snapshot)</p>
        <p className="mt-1">
          Leads: <span className="text-zinc-200">{b.leads ?? "—"}</span>
          {b.topCampaign ? (
            <>
              {" "}
              · Top campaign: <span className="text-zinc-200">{b.topCampaign}</span>
            </>
          ) : null}
          {b.status ? (
            <>
              {" "}
              · Status: <span className="text-zinc-200">{b.status}</span>
            </>
          ) : null}
        </p>
      </div>

      <div className="mt-4 space-y-3">
        {bundle.scenarios.length === 0 ? (
          <p className="text-sm text-zinc-500">No scenarios generated (enable scenario flag).</p>
        ) : (
          bundle.scenarios.map((s) => (
            <div key={s.scenarioId} className="rounded-lg border border-zinc-800 bg-black/25 p-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-medium text-zinc-100">{s.title}</p>
                <span className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase ${recBadge(s.recommendation)}`}>
                  {s.recommendation}
                </span>
              </div>
              <p className="mt-1 text-[11px] text-zinc-500">Confidence: {s.confidence}</p>
              <div className="mt-2 space-y-1 text-sm text-zinc-300">
                {s.estimates.slice(0, 2).map((e, i) => (
                  <p key={i}>
                    <span className="text-zinc-500">{e.metric}:</span>{" "}
                    {e.estimatedDeltaPct != null ? `~${e.estimatedDeltaPct > 0 ? "+" : ""}${e.estimatedDeltaPct}% est.` : "—"}{" "}
                    <span className="text-xs text-zinc-500">({e.confidence})</span>
                  </p>
                ))}
              </div>
              {s.risks.slice(0, 2).map((r, i) => (
                <p key={i} className="mt-2 text-xs text-amber-100/85">
                  Risk ({r.severity}): {r.title}
                </p>
              ))}
              <p className="mt-2 text-xs text-emerald-100/80">↑ {s.upsideSummary}</p>
              <p className="text-xs text-rose-100/75">↓ {s.downsideSummary}</p>
            </div>
          ))
        )}
      </div>

      <p className="mt-4 text-[11px] leading-relaxed text-zinc-600">
        Safety: simulation only — estimates, not guaranteed outcomes. Does not change production systems.
      </p>
    </div>
  );
}
