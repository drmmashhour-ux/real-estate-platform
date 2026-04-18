"use client";

import * as React from "react";
import type { GrowthFusionSystemResult, GrowthFusionAction } from "@/modules/growth/growth-fusion.types";
import type { GrowthPolicyEnforcementSnapshot } from "@/modules/growth/growth-policy-enforcement.types";
import { applyPolicyToFusionBridges } from "@/modules/growth/growth-policy-enforcement-bridge.service";

type FusionApi = GrowthFusionSystemResult;

function badgeImpact(i: GrowthFusionAction["impact"]): string {
  if (i === "high") return "border-rose-500/40 bg-rose-950/30 text-rose-100";
  if (i === "medium") return "border-amber-500/40 bg-amber-950/25 text-amber-100";
  return "border-zinc-600 bg-zinc-800/80 text-zinc-300";
}

function sourceBadge(s: GrowthFusionAction["source"]): string {
  const map: Record<GrowthFusionAction["source"], string> = {
    leads: "Leads",
    ads: "Ads",
    cro: "CRO",
    content: "Content",
    autopilot: "Autopilot",
  };
  return map[s];
}

export function GrowthFusionPanel({
  enforcementSnapshot,
}: {
  enforcementSnapshot?: GrowthPolicyEnforcementSnapshot | null;
}) {
  const [data, setData] = React.useState<FusionApi | null>(null);
  const [err, setErr] = React.useState<string | null>(null);

  const fusionGate = React.useMemo(
    () => applyPolicyToFusionBridges(enforcementSnapshot ?? null),
    [enforcementSnapshot],
  );

  React.useEffect(() => {
    let cancelled = false;
    void fetch("/api/growth/fusion", { credentials: "same-origin" })
      .then(async (r) => {
        const j = await r.json();
        if (!r.ok) throw new Error(j.error ?? "Fusion load failed");
        return j as FusionApi;
      })
      .then((j) => {
        if (!cancelled) setData(j);
      })
      .catch((e: Error) => {
        if (!cancelled) setErr(e.message);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (err) {
    return <p className="text-sm text-red-400">{err}</p>;
  }
  if (!data) {
    return <p className="text-sm text-zinc-500">Loading Growth Fusion…</p>;
  }

  const { summary, actions } = data;
  const focus = actions[0]?.title ?? "—";
  const counts = {
    leads: summary.grouped.leads.length,
    ads: summary.grouped.ads.length,
    cro: summary.grouped.cro.length,
    content: summary.grouped.content.length,
    autopilot: summary.grouped.autopilot.length,
  };

  return (
    <div className="rounded-xl border border-violet-800/50 bg-violet-950/20 p-4">
      <h3 className="text-sm font-semibold text-violet-100">🧠 Growth Fusion System</h3>
      <p className="mt-1 text-xs text-zinc-500">
        Read-only fusion across leads, ads, CRO, content, and autopilot. Advisory only — no auto-execution.
      </p>
      {fusionGate.suppressBridgePromotion ? (
        <p className="mt-2 rounded border border-amber-500/30 bg-amber-950/20 px-2 py-1.5 text-[11px] text-amber-100/90">
          Bridge outputs are not promoted to downstream conversion helpers under current enforcement (summary
          unchanged).
        </p>
      ) : null}

      <div className="mt-4 flex flex-wrap items-center gap-3 text-sm">
        <span
          className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide ${
            summary.status === "strong"
              ? "border-emerald-500/50 bg-emerald-950/40 text-emerald-200"
              : summary.status === "weak"
                ? "border-amber-500/50 bg-amber-950/40 text-amber-100"
                : "border-zinc-600 bg-zinc-900/80 text-zinc-200"
          }`}
        >
          Status: {summary.status}
        </span>
        <span className="text-zinc-400">
          Confidence: <strong className="text-zinc-100">{(summary.confidence * 100).toFixed(0)}%</strong>
        </span>
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-3">
        <div>
          <p className="text-[11px] font-semibold uppercase text-zinc-500">Top problems</p>
          <ul className="mt-1 list-inside list-disc text-sm text-zinc-300">
            {summary.topProblems.slice(0, 3).map((p) => (
              <li key={p}>{p}</li>
            ))}
            {summary.topProblems.length === 0 ? <li className="text-zinc-600">None flagged</li> : null}
          </ul>
        </div>
        <div>
          <p className="text-[11px] font-semibold uppercase text-zinc-500">Top opportunities</p>
          <ul className="mt-1 list-inside list-disc text-sm text-zinc-300">
            {summary.topOpportunities.slice(0, 3).map((p) => (
              <li key={p}>{p}</li>
            ))}
            {summary.topOpportunities.length === 0 ? <li className="text-zinc-600">None flagged</li> : null}
          </ul>
        </div>
        <div>
          <p className="text-[11px] font-semibold uppercase text-zinc-500">Signal coverage</p>
          <div className="mt-1 flex flex-wrap gap-2 text-[11px] text-zinc-400">
            <span>leads {counts.leads}</span>
            <span>ads {counts.ads}</span>
            <span>cro {counts.cro}</span>
            <span>content {counts.content}</span>
            <span>autopilot {counts.autopilot}</span>
          </div>
        </div>
      </div>

      <div className="mt-4 border-t border-violet-900/40 pt-4">
        <p className="text-[11px] font-semibold uppercase text-zinc-500">Prioritized actions</p>
        <ul className="mt-2 space-y-3">
          {actions.map((a) => (
            <li
              key={a.id}
              className="rounded-lg border border-zinc-800/80 bg-black/20 px-3 py-2 text-sm text-zinc-300"
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <span className="font-medium text-zinc-100">{a.title}</span>
                <span className="shrink-0 rounded border border-violet-800/60 px-1.5 text-[10px] text-violet-200">
                  {sourceBadge(a.source)}
                </span>
              </div>
              <p className="mt-1 text-xs text-zinc-500">{a.description}</p>
              <div className="mt-2 flex flex-wrap gap-2 text-[11px] text-zinc-500">
                <span className={`rounded border px-1.5 ${badgeImpact(a.impact)}`}>{a.impact} impact</span>
                <span>conf {(a.confidence * 100).toFixed(0)}%</span>
                <span>priority {a.priorityScore}</span>
                <span className="text-zinc-600">{a.executionMode.replace(/_/g, " ")}</span>
              </div>
              <p className="mt-1 text-[11px] text-zinc-500">
                <span className="text-zinc-600">Why: </span>
                {a.why}
              </p>
            </li>
          ))}
        </ul>
      </div>

      <p className="mt-4 border-t border-violet-900/40 pt-3 text-sm text-violet-200/90">
        🎯 Focus: <span className="font-medium text-white">{focus}</span>
      </p>
    </div>
  );
}
