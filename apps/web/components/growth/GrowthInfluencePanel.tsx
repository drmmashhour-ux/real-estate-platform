"use client";

import * as React from "react";
import Link from "next/link";
import { buildInfluenceSuggestions, type InfluenceSnapshot } from "@/modules/growth/ai-autopilot-influence.service";

function impactBadge(impact: string): string {
  if (impact === "high") return "border-rose-500/40 bg-rose-950/30 text-rose-100";
  if (impact === "medium") return "border-amber-500/40 bg-amber-950/25 text-amber-100";
  return "border-zinc-600 bg-zinc-800/80 text-zinc-300";
}

function targetLabel(t: string): string {
  return t === "ads_strategy" ? "Ads strategy" : "CRO / UI";
}

export function GrowthInfluencePanel({
  snapshot,
  base,
  aiAutopilotEnabled,
}: {
  snapshot: InfluenceSnapshot;
  base: string;
  /** When true, “Convert to action” links to the autopilot approval panel anchor. */
  aiAutopilotEnabled: boolean;
}) {
  const suggestions = React.useMemo(() => buildInfluenceSuggestions(snapshot), [snapshot]);

  const logged = React.useRef(false);
  React.useEffect(() => {
    if (suggestions.length === 0 || logged.current) return;
    logged.current = true;
    void fetch("/api/growth/influence/telemetry", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify({ event: "generated", count: suggestions.length }),
    });
    void fetch("/api/growth/influence/telemetry", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify({ event: "viewed", count: suggestions.length }),
    });
  }, [suggestions.length]);

  const convertHref = aiAutopilotEnabled ? `${base}#growth-ai-autopilot-panel` : `${base}/campaigns`;

  return (
    <div className="rounded-xl border border-cyan-900/40 bg-cyan-950/15 p-4">
      <h3 className="text-sm font-semibold text-cyan-100">📢 Ads strategy suggestions</h3>
      <p className="mt-1 text-xs text-zinc-500">
        Campaign and funnel snapshot — top 3 advisory items. No spend changes, no auto-deploy, no API calls.
      </p>

      <div className="mt-3 grid gap-2 rounded-lg border border-zinc-800/80 bg-black/20 px-3 py-2 text-xs text-zinc-400 sm:grid-cols-3">
        <div>
          <span className="text-zinc-500">Campaigns</span>
          <p className="font-mono text-zinc-200">{snapshot.campaignsCount}</p>
        </div>
        <div>
          <span className="text-zinc-500">Clicks (90d)</span>
          <p className="font-mono text-zinc-200">{snapshot.clicks90d}</p>
        </div>
        <div>
          <span className="text-zinc-500">Landing leads</span>
          <p className="font-mono text-zinc-200">{snapshot.leadsFromPublicLanding}</p>
        </div>
      </div>

      <p className="mt-2 text-[11px] text-zinc-600">
        View→lead:{" "}
        {snapshot.conversionRateViewToLeadPercent != null
          ? `${snapshot.conversionRateViewToLeadPercent}%`
          : "—"}{" "}
        · priority uses the same impact/confidence blend as AI Autopilot sorting.
      </p>

      <ul className="mt-4 space-y-3">
        {suggestions.map((s) => (
          <li
            key={s.id}
            className="rounded-lg border border-zinc-800 bg-zinc-950/50 p-3"
            data-influence-suggestion={s.id}
          >
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded border border-cyan-700/50 bg-cyan-950/40 px-2 py-0.5 text-[10px] font-medium uppercase text-cyan-200/90">
                {targetLabel(s.target)}
              </span>
              <span
                className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase ${impactBadge(s.impact)}`}
              >
                {s.impact} impact
              </span>
              <span className="text-[10px] text-zinc-500">score {s.priorityScore}</span>
            </div>
            <p className="mt-2 text-sm font-medium text-zinc-100">{s.title}</p>
            <p className="mt-1 text-sm text-zinc-400">{s.description}</p>
            <p className="mt-2 text-[11px] text-zinc-500">{s.reason}</p>
            <p className="mt-2 text-[11px] text-amber-200/90">
              🧠 AI Suggestion (Not Applied) · confidence {Math.round(s.confidence * 100)}%
            </p>
            <div className="mt-2 flex flex-wrap gap-3">
              <Link
                href={convertHref}
                className="text-xs text-emerald-400 hover:text-emerald-300"
                onClick={() =>
                  void fetch("/api/growth/influence/telemetry", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    credentials: "same-origin",
                    body: JSON.stringify({ event: "convert", suggestionId: s.id }),
                  })
                }
              >
                Convert to action →
              </Link>
              <span className="text-[10px] text-zinc-600">
                {aiAutopilotEnabled
                  ? "Opens AI Autopilot — approval still required for execution."
                  : "Enable AI Autopilot or use Campaigns for manual work."}
              </span>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
