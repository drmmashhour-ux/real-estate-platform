"use client";

/**
 * Internal-only scenario lab — no server execution, no payments, no messaging.
 */

import * as React from "react";
import type { SimulationActionInput, SimulationOutcome } from "@/modules/growth/action-simulation.types";
import { readAndClearActionSimulationPreset } from "./growth-action-simulation-preset";

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

const recClass: Record<SimulationOutcome["overallRecommendation"], string> = {
  favorable: "text-emerald-200/90",
  mixed: "text-amber-200/90",
  weak: "text-zinc-400",
  insufficient_data: "text-rose-200/90",
};

export function ActionSimulationPanel() {
  const [title, setTitle] = React.useState("If we change focus for the next 14d");
  const [category, setCategory] = React.useState<SimulationActionInput["category"]>("demand_generation");
  const [intensity, setIntensity] = React.useState<SimulationActionInput["intensity"]>("medium");
  const [windowDays, setWindowDays] = React.useState(14);
  const [targetCity, setTargetCity] = React.useState("");
  const [rationale, setRationale] = React.useState("");

  const [outcome, setOutcome] = React.useState<SimulationOutcome | null>(null);
  const [err, setErr] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    const p = readAndClearActionSimulationPreset();
    if (!p) return;
    if (p.title) setTitle(p.title);
    if (p.category) setCategory(p.category);
    if (p.intensity) setIntensity(p.intensity);
    if (p.windowDays) setWindowDays(p.windowDays);
    if (p.targetCity != null) setTargetCity(p.targetCity);
    if (p.rationale != null) setRationale(p.rationale);
  }, []);

  const runSim = React.useCallback(() => {
    setLoading(true);
    setErr(null);
    const body: Record<string, unknown> = {
      title,
      category,
      intensity,
      windowDays,
      rationale: rationale || undefined,
      targetCity: targetCity.trim() || undefined,
    };
    void fetch("/api/growth/action-simulation", {
      method: "POST",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })
      .then(async (r) => {
        const j = (await r.json()) as { outcome?: SimulationOutcome; error?: string };
        if (!r.ok) throw new Error(j.error ?? "Failed");
        setOutcome(j.outcome ?? null);
      })
      .catch((e: unknown) => setErr(e instanceof Error ? e.message : "Error"))
      .finally(() => setLoading(false));
  }, [title, category, intensity, windowDays, rationale, targetCity]);

  return (
    <section
      id="growth-mc-action-simulation"
      className="scroll-mt-24 rounded-xl border border-cyan-900/40 bg-cyan-950/15 p-4"
      data-growth-action-simulation-v1
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-cyan-300/90">
            Predicted effects (simulation)
          </p>
          <h3 className="mt-1 text-lg font-semibold text-zinc-50">Action simulation lab</h3>
          <p className="mt-1 max-w-3xl text-[11px] leading-relaxed text-zinc-500">
            Scenario guidance from stored telemetry — not a guarantee. No automation, messaging, or billing changes are
            triggered.
          </p>
        </div>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <label className="block text-[11px] text-zinc-500">
          Title
          <input
            className="mt-1 w-full rounded border border-zinc-700 bg-black/40 px-2 py-1.5 text-sm text-zinc-100"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </label>
        <label className="block text-[11px] text-zinc-500">
          Category
          <select
            className="mt-1 w-full rounded border border-zinc-700 bg-black/40 px-2 py-1.5 text-sm text-zinc-100"
            value={category}
            onChange={(e) => setCategory(e.target.value as SimulationActionInput["category"])}
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
            className="mt-1 w-full rounded border border-zinc-700 bg-black/40 px-2 py-1.5 text-sm text-zinc-100"
            value={intensity}
            onChange={(e) => setIntensity(e.target.value as SimulationActionInput["intensity"])}
          >
            <option value="low">low</option>
            <option value="medium">medium</option>
            <option value="high">high</option>
          </select>
        </label>
        <label className="block text-[11px] text-zinc-500">
          Window (days)
          <input
            type="number"
            min={7}
            max={45}
            className="mt-1 w-full rounded border border-zinc-700 bg-black/40 px-2 py-1.5 text-sm text-zinc-100"
            value={windowDays}
            onChange={(e) => setWindowDays(Number(e.target.value))}
          />
        </label>
        <label className="block text-[11px] text-zinc-500 sm:col-span-2">
          Target city (optional)
          <input
            className="mt-1 w-full rounded border border-zinc-700 bg-black/40 px-2 py-1.5 text-sm text-zinc-100"
            value={targetCity}
            onChange={(e) => setTargetCity(e.target.value)}
            placeholder="e.g. Montréal"
          />
        </label>
        <label className="block text-[11px] text-zinc-500 sm:col-span-2">
          Rationale (optional)
          <textarea
            className="mt-1 min-h-[60px] w-full rounded border border-zinc-700 bg-black/40 px-2 py-1.5 text-sm text-zinc-100"
            value={rationale}
            onChange={(e) => setRationale(e.target.value)}
          />
        </label>
      </div>

      <button
        type="button"
        disabled={loading}
        className="mt-4 rounded-lg border border-cyan-700/60 bg-cyan-950/40 px-4 py-2 text-sm font-medium text-cyan-100 hover:bg-cyan-900/40 disabled:opacity-50"
        onClick={() => runSim()}
      >
        {loading ? "Running…" : "Simulate outcome"}
      </button>

      {err ? <p className="mt-3 text-sm text-rose-300/90">{err}</p> : null}

      {outcome ? (
        <div className="mt-6 space-y-4 rounded-lg border border-zinc-800 bg-black/30 p-4">
          <div>
            <p className="text-[11px] uppercase tracking-wide text-zinc-500">Overall</p>
            <p className={`text-lg font-semibold capitalize ${recClass[outcome.overallRecommendation]}`}>
              {outcome.overallRecommendation.replace(/_/g, " ")}
            </p>
            <p className="mt-1 text-[11px] text-zinc-500">
              Confidence: <span className="text-zinc-300">{outcome.overallConfidence}</span> · generated{" "}
              {new Date(outcome.generatedAt).toLocaleString()}
            </p>
          </div>

          <div>
            <p className="text-[11px] font-semibold uppercase text-zinc-400">Likely directional effects</p>
            <ul className="mt-2 space-y-3">
              {outcome.effects.map((e) => (
                <li key={e.metric} className="rounded-md border border-zinc-800/80 p-2 text-sm">
                  <p className="font-medium text-zinc-200">{e.metric}</p>
                  <p className="text-xs text-zinc-500">
                    Baseline: {e.baselineValue ?? "—"} · direction: {e.predictedDirection} · magnitude:{" "}
                    {e.predictedMagnitude} · signal confidence: {e.confidence}
                  </p>
                  <p className="mt-1 text-xs text-zinc-400">{e.explanation}</p>
                </li>
              ))}
            </ul>
          </div>

          {outcome.risks.length ? (
            <div>
              <p className="text-[11px] font-semibold uppercase text-amber-400/90">Risks & uncertainty</p>
              <ul className="mt-1 list-inside list-disc text-xs text-amber-100/85">
                {outcome.risks.map((r) => (
                  <li key={r}>{r}</li>
                ))}
              </ul>
            </div>
          ) : null}

          {outcome.assumptions.length ? (
            <div>
              <p className="text-[11px] font-semibold uppercase text-zinc-500">Assumptions</p>
              <ul className="mt-1 list-inside list-disc text-xs text-zinc-500">
                {outcome.assumptions.map((a) => (
                  <li key={a}>{a}</li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
