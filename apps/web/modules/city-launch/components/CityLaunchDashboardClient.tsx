"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import { loadTerritories } from "@/modules/market-domination/market-domination.service";

import { buildCityLaunchFullView } from "../city-launch.service";

import type { LaunchPhaseId, StepCategory } from "../city-launch.types";

type Props = { adminBase: string };

const PHASE_LABEL: Record<LaunchPhaseId, string> = {
  PRE_LAUNCH: "Pre-launch",
  LAUNCH: "Launch",
  EARLY_TRACTION: "Early traction",
  SCALE: "Scale",
  DOMINATION: "Domination",
};

export function CityLaunchDashboardClient({ adminBase }: Props) {
  const territories = useMemo(() => loadTerritories(), []);
  const [selectedId, setSelectedId] = useState<string>(territories[0]?.id ?? "");
  const [phaseFilter, setPhaseFilter] = useState<LaunchPhaseId | "ALL">("ALL");
  const [catFilter, setCatFilter] = useState<StepCategory | "ALL">("ALL");

  const view = useMemo(() => (selectedId ? buildCityLaunchFullView(selectedId) : null), [selectedId]);

  const filteredSteps = useMemo(() => {
    if (!view) return [];
    return view.steps.filter((s) => {
      if (phaseFilter !== "ALL" && s.phaseId !== phaseFilter) return false;
      if (catFilter !== "ALL" && s.category !== catFilter) return false;
      return true;
    });
  }, [view, phaseFilter, catFilter]);

  return (
    <div className="mx-auto max-w-6xl space-y-8 p-6 text-white">
      <header className="space-y-2">
        <p className="text-[10px] uppercase tracking-[0.2em] text-emerald-400/90">LECIPM growth ops</p>
        <h1 className="text-2xl font-semibold">City launch playbook</h1>
        <p className="max-w-3xl text-sm text-zinc-400">
          Turns Market Domination + Growth Brain signals into executable steps. Progress is stored in-browser for
          demos — connect CRM for production tracking.
        </p>
      </header>

      <section className="rounded-2xl border border-white/10 bg-white/5 p-4">
        <h2 className="text-sm font-semibold text-white">1. Select city / territory</h2>
        <div className="mt-3 flex flex-wrap gap-2">
          {territories.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setSelectedId(t.id)}
              className={`rounded-full border px-4 py-1.5 text-sm ${
                selectedId === t.id
                  ? "border-emerald-500/60 bg-emerald-950/40 text-emerald-100"
                  : "border-white/15 text-zinc-300 hover:border-white/30"
              }`}
            >
              {t.name}
            </button>
          ))}
        </div>
        {selectedId ? (
          <Link
            href={`${adminBase}/city-launch/${encodeURIComponent(selectedId)}`}
            className="mt-4 inline-block text-sm text-sky-300 underline"
          >
            Open full playbook →
          </Link>
        ) : null}
      </section>

      {!view ? (
        <p className="text-zinc-500">Select a territory.</p>
      ) : (
        <>
          <section className="grid gap-4 rounded-2xl border border-white/10 bg-zinc-950/40 p-4 sm:grid-cols-3">
            <div>
              <p className="text-[10px] uppercase text-zinc-500">Readiness</p>
              <p className="text-2xl font-semibold text-emerald-200">{view.integration.readinessScore}</p>
              <p className="text-xs text-zinc-400">{view.integration.readinessBand}</p>
            </div>
            <div>
              <p className="text-[10px] uppercase text-zinc-500">Domination proxy</p>
              <p className="text-2xl font-semibold text-amber-100">{view.integration.dominationScore}</p>
              <p className="text-xs text-zinc-400">Competitor pressure {view.integration.competitorPressure.toFixed(1)}/10</p>
            </div>
            <div>
              <p className="text-[10px] uppercase text-zinc-500">Current phase</p>
              <p className="text-lg font-semibold">{PHASE_LABEL[view.currentPhaseId]}</p>
              <p className="text-xs text-zinc-400">{view.progress.completionPercent}% playbook complete</p>
            </div>
          </section>

          <section className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <h2 className="text-sm font-semibold">3. Playbook overview</h2>
            <p className="mt-2 text-sm leading-relaxed text-zinc-300">{view.playbook.launchStrategySummary}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {view.playbook.priorityHubs.map((h) => (
                <span key={h} className="rounded-full bg-white/10 px-2 py-0.5 text-xs text-white">
                  {h}
                </span>
              ))}
            </div>
            <p className="mt-2 text-xs text-zinc-500">
              Timeline estimate ~{view.playbook.estimatedTimelineWeeks} weeks (rough band from readiness).
            </p>
          </section>

          <section className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <h2 className="text-sm font-semibold">4. Phase timeline</h2>
            <div className="mt-3 grid gap-2 md:grid-cols-5">
              {view.playbook.phases.map((p) => (
                <div key={p.id} className="rounded-xl border border-white/10 bg-black/20 p-3 text-xs">
                  <p className="font-semibold text-white">{p.label}</p>
                  <p className="mt-1 text-zinc-500">~{p.estimatedWeeksSpan} wk span</p>
                  <ul className="mt-2 list-disc space-y-1 pl-4 text-zinc-400">
                    {p.objectives.slice(0, 2).map((o) => (
                      <li key={o}>{o}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <h2 className="text-sm font-semibold">5. Steps</h2>
              <div className="flex flex-wrap gap-2 text-xs">
                <select
                  value={phaseFilter}
                  onChange={(e) => setPhaseFilter(e.target.value as LaunchPhaseId | "ALL")}
                  className="rounded-lg border border-white/15 bg-zinc-900 px-2 py-1 text-zinc-200"
                >
                  <option value="ALL">All phases</option>
                  {Object.entries(PHASE_LABEL).map(([k, v]) => (
                    <option key={k} value={k}>
                      {v}
                    </option>
                  ))}
                </select>
                <select
                  value={catFilter}
                  onChange={(e) => setCatFilter(e.target.value as StepCategory | "ALL")}
                  className="rounded-lg border border-white/15 bg-zinc-900 px-2 py-1 text-zinc-200"
                >
                  <option value="ALL">All categories</option>
                  {(["SALES", "MARKETING", "SUPPLY", "PRODUCT", "OPS"] as const).map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="mt-3 max-h-[420px] space-y-2 overflow-y-auto">
              {filteredSteps.map((s) => (
                <div
                  key={s.id}
                  className={`rounded-xl border px-3 py-2 text-sm ${
                    s.isAdaptation ? "border-violet-600/40 bg-violet-950/30" : "border-white/10 bg-black/10"
                  }`}
                >
                  <div className="flex flex-wrap justify-between gap-2">
                    <span className="font-medium text-white">{s.title}</span>
                    <span className="text-[10px] text-zinc-500">
                      {s.phaseId} · {s.category} · {s.priority}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-zinc-400">{s.description}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <h2 className="text-sm font-semibold">6. Progress</h2>
              <p className="mt-2 text-3xl font-semibold text-emerald-200">{view.progress.completionPercent}%</p>
              <p className="text-xs text-zinc-500">
                {view.progress.completedCount} done · {view.progress.inProgressCount} in progress ·{" "}
                {view.progress.blockedCount} blocked · {view.progress.velocityStepsPerWeek.toFixed(1)} steps/wk
              </p>
              {view.progress.delays.length ? (
                <ul className="mt-2 list-disc pl-5 text-xs text-amber-200/90">
                  {view.progress.delays.map((d) => (
                    <li key={d}>{d}</li>
                  ))}
                </ul>
              ) : null}
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <h2 className="text-sm font-semibold">7. Alerts</h2>
              <ul className="mt-2 space-y-2 text-xs text-zinc-300">
                {view.alerts.map((a) => (
                  <li key={a.id} className="rounded-lg border border-white/10 bg-black/20 px-2 py-1">
                    <span className="font-medium text-white">{a.title}</span> — {a.body}
                  </li>
                ))}
              </ul>
              {view.alerts.length === 0 ? <p className="text-xs text-zinc-500">No alerts.</p> : null}
            </div>
          </section>

          <section className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <h2 className="text-sm font-semibold">8. Adaptation suggestions</h2>
            <div className="mt-3 grid gap-2 md:grid-cols-2">
              {view.adaptation.suggestions.map((s) => (
                <div key={s.id} className="rounded-xl border border-amber-700/30 bg-amber-950/20 p-3 text-xs">
                  <p className="font-semibold text-amber-100">{s.title}</p>
                  <p className="mt-1 text-zinc-400">{s.rationale}</p>
                  <p className="mt-2 text-[10px] uppercase text-zinc-500">Urgency: {s.urgency}</p>
                </div>
              ))}
            </div>
            {view.adaptation.metricsDrivers.length ? (
              <p className="mt-3 text-[11px] text-zinc-600">
                Drivers: {view.adaptation.metricsDrivers.join(", ")}
              </p>
            ) : null}
          </section>

          <section className="rounded-2xl border border-white/10 bg-zinc-950/60 p-4 text-xs text-zinc-400">
            <p className="font-semibold text-zinc-300">Explainability</p>
            <p className="mt-2">{view.explainability.headline}</p>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              {view.explainability.primaryDrivers.map((x) => (
                <li key={x}>{x}</li>
              ))}
            </ul>
          </section>
        </>
      )}
    </div>
  );
}
