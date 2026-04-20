"use client";

import * as React from "react";
import type { MarketExpansionRecommendation } from "@/modules/growth/market-expansion.types";
import { presetAndScrollToActionSimulation } from "./growth-action-simulation-preset";

export function MarketExpansionPanel({
  simulateOutcomeEnabled = false,
}: {
  simulateOutcomeEnabled?: boolean;
}) {
  const [data, setData] = React.useState<MarketExpansionRecommendation | null | "err" | "loading">("loading");
  const [disclaimer, setDisclaimer] = React.useState("");

  React.useEffect(() => {
    let cancel = false;
    (async () => {
      const params = new URLSearchParams({ windowDays: "30" });
      const res = await fetch(`/api/growth/market-expansion/recommendations?${params}`, {
        credentials: "same-origin",
      });
      if (cancel) return;
      if (!res.ok) {
        setData("err");
        return;
      }
      const j = (await res.json()) as {
        recommendation: MarketExpansionRecommendation | null;
        disclaimer?: string;
      };
      setData(j.recommendation);
      setDisclaimer(j.disclaimer ?? "");
    })();
    return () => {
      cancel = true;
    };
  }, []);

  if (data === "loading") {
    return (
      <section className="rounded-xl border border-emerald-900/40 bg-emerald-950/10 p-4" data-growth-market-expansion>
        <p className="text-xs text-zinc-500">Loading market expansion…</p>
      </section>
    );
  }
  if (data === "err" || !data) {
    return (
      <section className="rounded-xl border border-emerald-900/40 bg-emerald-950/10 p-4" data-growth-market-expansion>
        <p className="text-sm text-amber-200/90">Market expansion unavailable — enable flags + Fast Deal city comparison.</p>
      </section>
    );
  }

  return (
    <section className="rounded-xl border border-emerald-800/45 bg-emerald-950/15 p-4" data-growth-market-expansion>
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.15em] text-emerald-300/90">Expansion</p>
        <h3 className="mt-1 text-lg font-semibold text-zinc-100">Market expansion (internal)</h3>
        <p className="mt-1 max-w-3xl text-[11px] text-zinc-500">{disclaimer}</p>
        {simulateOutcomeEnabled ? (
          <button
            type="button"
            className="mt-2 text-[11px] text-emerald-400/90 hover:underline"
            onClick={() =>
              presetAndScrollToActionSimulation({
                title: `Expansion focus (${data.referenceCity ?? "reference market"})`,
                category: "city_domination",
                targetCity: data.referenceCity ?? undefined,
                rationale: "Opened from market expansion — directional effects only.",
                windowDays: 30,
                intensity: "medium",
              })
            }
          >
            Simulate outcome →
          </button>
        ) : null}
      </div>

      <p className="mt-3 text-sm text-zinc-400">
        Reference city (similarity anchor):{" "}
        <span className="font-semibold text-zinc-200">{data.referenceCity ?? "—"}</span>
      </p>

      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[920px] border-collapse text-left text-xs text-zinc-300">
          <thead>
            <tr className="border-b border-white/10 text-[10px] uppercase tracking-wide text-zinc-500">
              <th className="py-2 pr-2">City</th>
              <th className="py-2 pr-2">Score</th>
              <th className="py-2 pr-2">Readiness</th>
              <th className="py-2 pr-2">Confidence</th>
              <th className="py-2 pr-2">Sim×top</th>
              <th className="py-2">Signals</th>
            </tr>
          </thead>
          <tbody>
            {data.topCandidates.map((r) => (
              <tr key={r.city} className="border-b border-white/5">
                <td className="py-2 pr-2 font-medium text-white">{r.city}</td>
                <td className="py-2 pr-2 tabular-nums">{r.score}</td>
                <td className="py-2 pr-2 capitalize">{r.readiness}</td>
                <td className="py-2 pr-2 capitalize">{r.confidence}</td>
                <td className="py-2 pr-2 tabular-nums">
                  {r.similarityToTopCity != null ? (r.similarityToTopCity * 100).toFixed(0) + "%" : "—"}
                </td>
                <td className="py-2 text-[10px] text-zinc-500">
                  D {r.demandSignal ?? "—"} · S {r.supplySignal ?? "—"} · C {r.competitionSignal ?? "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-4 rounded-lg border border-amber-900/30 bg-black/25 p-3">
        <p className="text-xs font-semibold text-amber-200/90">Rationale & warnings (per row)</p>
        <ul className="mt-2 space-y-3 text-[11px] text-zinc-400">
          {data.topCandidates.map((r) => (
            <li key={`w-${r.city}`}>
              <span className="font-semibold text-zinc-300">{r.city}:</span> {r.rationale}
              {r.warnings.length > 0 ? (
                <span className="block text-amber-200/80">Warnings: {r.warnings.join(" · ")}</span>
              ) : null}
            </li>
          ))}
        </ul>
      </div>

      {data.rejectedCandidates.length > 0 ? (
        <div className="mt-4 text-xs text-zinc-500">
          <p className="font-semibold text-zinc-400">Filtered out</p>
          <ul className="mt-2 list-inside list-disc">
            {data.rejectedCandidates.map((x) => (
              <li key={x.city + x.reason}>
                {x.city}: {x.reason}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className="mt-4 rounded-lg border border-zinc-800 bg-black/20 p-3">
        <p className="text-xs font-semibold text-zinc-400">Insights</p>
        <ul className="mt-2 list-inside list-disc text-sm text-zinc-500">
          {data.insights.map((i) => (
            <li key={i}>{i}</li>
          ))}
        </ul>
      </div>

      <p className="mt-2 text-[10px] text-zinc-600">Generated {new Date(data.generatedAt).toLocaleString()}</p>
    </section>
  );
}
