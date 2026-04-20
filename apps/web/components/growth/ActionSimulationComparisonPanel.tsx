"use client";

/**
 * Compare two hypothetical actions — same advisory contract as single simulation.
 */

import * as React from "react";
import type { SimulationActionInput } from "@/modules/growth/action-simulation.types";

const CATS: SimulationActionInput["category"][] = [
  "broker_acquisition",
  "demand_generation",
  "supply_growth",
  "conversion_fix",
  "routing_shift",
  "timing_focus",
  "city_domination",
  "retention_focus",
];

export function ActionSimulationComparisonPanel() {
  const [aTitle, setATitle] = React.useState("Scenario A");
  const [aCat, setACat] = React.useState<SimulationActionInput["category"]>("broker_acquisition");
  const [aInt, setAInt] = React.useState<SimulationActionInput["intensity"]>("medium");
  const [aWin, setAWin] = React.useState(14);

  const [bTitle, setBTitle] = React.useState("Scenario B");
  const [bCat, setBCat] = React.useState<SimulationActionInput["category"]>("conversion_fix");
  const [bInt, setBInt] = React.useState<SimulationActionInput["intensity"]>("medium");
  const [bWin, setBWin] = React.useState(14);

  const [cmp, setCmp] = React.useState<
    import("@/modules/growth/action-simulation.types").SimulationComparison | null
  >(null);
  const [err, setErr] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);

  const run = React.useCallback(() => {
    setLoading(true);
    setErr(null);
    void fetch("/api/growth/action-simulation/compare", {
      method: "POST",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        actionA: { title: aTitle, category: aCat, intensity: aInt, windowDays: aWin },
        actionB: { title: bTitle, category: bCat, intensity: bInt, windowDays: bWin },
      }),
    })
      .then(async (r) => {
        const j = (await r.json()) as {
          comparison?: import("@/modules/growth/action-simulation.types").SimulationComparison;
          error?: string;
        };
        if (!r.ok) throw new Error(j.error ?? "Failed");
        setCmp(j.comparison ?? null);
      })
      .catch((e: unknown) => setErr(e instanceof Error ? e.message : "Error"))
      .finally(() => setLoading(false));
  }, [aTitle, aCat, aInt, aWin, bTitle, bCat, bInt, bWin]);

  return (
    <section
      className="rounded-xl border border-slate-800/90 bg-slate-950/25 p-4"
      data-growth-action-simulation-compare-v1
    >
      <h4 className="text-sm font-semibold text-zinc-200">Compare two actions</h4>
      <p className="mt-1 text-[11px] text-zinc-500">
        Uses the same baseline snapshot for both scenarios — conservative ordering only.
      </p>

      <div className="mt-4 grid gap-6 lg:grid-cols-2">
        <div className="space-y-2 rounded-lg border border-zinc-800 p-3">
          <p className="text-[11px] font-semibold uppercase text-cyan-400/90">Action A</p>
          <label className="block text-[11px] text-zinc-500">
            Title
            <input
              className="mt-1 w-full rounded border border-zinc-700 bg-black/40 px-2 py-1 text-sm text-zinc-100"
              value={aTitle}
              onChange={(e) => setATitle(e.target.value)}
            />
          </label>
          <label className="block text-[11px] text-zinc-500">
            Category
            <select
              className="mt-1 w-full rounded border border-zinc-700 bg-black/40 px-2 py-1 text-sm text-zinc-100"
              value={aCat}
              onChange={(e) => setACat(e.target.value as SimulationActionInput["category"])}
            >
              {CATS.map((c) => (
                <option key={c} value={c}>
                  {c.replace(/_/g, " ")}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-[11px] text-zinc-500">
            Intensity
            <select
              className="mt-1 w-full rounded border border-zinc-700 bg-black/40 px-2 py-1 text-sm text-zinc-100"
              value={aInt}
              onChange={(e) => setAInt(e.target.value as SimulationActionInput["intensity"])}
            >
              <option value="low">low</option>
              <option value="medium">medium</option>
              <option value="high">high</option>
            </select>
          </label>
          <label className="block text-[11px] text-zinc-500">
            Window days
            <input
              type="number"
              min={7}
              max={45}
              className="mt-1 w-full rounded border border-zinc-700 bg-black/40 px-2 py-1 text-sm text-zinc-100"
              value={aWin}
              onChange={(e) => setAWin(Number(e.target.value))}
            />
          </label>
        </div>

        <div className="space-y-2 rounded-lg border border-zinc-800 p-3">
          <p className="text-[11px] font-semibold uppercase text-violet-400/90">Action B</p>
          <label className="block text-[11px] text-zinc-500">
            Title
            <input
              className="mt-1 w-full rounded border border-zinc-700 bg-black/40 px-2 py-1 text-sm text-zinc-100"
              value={bTitle}
              onChange={(e) => setBTitle(e.target.value)}
            />
          </label>
          <label className="block text-[11px] text-zinc-500">
            Category
            <select
              className="mt-1 w-full rounded border border-zinc-700 bg-black/40 px-2 py-1 text-sm text-zinc-100"
              value={bCat}
              onChange={(e) => setBCat(e.target.value as SimulationActionInput["category"])}
            >
              {CATS.map((c) => (
                <option key={c} value={c}>
                  {c.replace(/_/g, " ")}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-[11px] text-zinc-500">
            Intensity
            <select
              className="mt-1 w-full rounded border border-zinc-700 bg-black/40 px-2 py-1 text-sm text-zinc-100"
              value={bInt}
              onChange={(e) => setBInt(e.target.value as SimulationActionInput["intensity"])}
            >
              <option value="low">low</option>
              <option value="medium">medium</option>
              <option value="high">high</option>
            </select>
          </label>
          <label className="block text-[11px] text-zinc-500">
            Window days
            <input
              type="number"
              min={7}
              max={45}
              className="mt-1 w-full rounded border border-zinc-700 bg-black/40 px-2 py-1 text-sm text-zinc-100"
              value={bWin}
              onChange={(e) => setBWin(Number(e.target.value))}
            />
          </label>
        </div>
      </div>

      <button
        type="button"
        disabled={loading}
        className="mt-4 rounded-lg border border-slate-600 px-4 py-2 text-sm text-zinc-200 hover:bg-zinc-900 disabled:opacity-50"
        onClick={() => run()}
      >
        {loading ? "Comparing…" : "Compare simulations"}
      </button>

      {err ? <p className="mt-3 text-sm text-rose-300/90">{err}</p> : null}

      {cmp ? (
        <div className="mt-4 rounded-lg border border-zinc-800 bg-black/30 p-4 text-sm">
          <p className="text-[11px] uppercase text-zinc-500">Likely better path (advisory)</p>
          <p className="mt-1 text-lg font-semibold capitalize text-zinc-100">{cmp.winner.replace(/_/g, " ")}</p>
          <p className="mt-2 text-xs leading-relaxed text-zinc-400">{cmp.rationale}</p>
          <p className="mt-3 text-[11px] text-zinc-500">Confidence: {cmp.confidence}</p>
        </div>
      ) : null}
    </section>
  );
}
