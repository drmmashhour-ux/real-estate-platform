"use client";

import * as React from "react";
import type { CapitalAllocationPlan } from "@/modules/growth/capital-allocation.types";
import { presetAndScrollToActionSimulation } from "./growth-action-simulation-preset";

export function CapitalAllocationPanel({
  simulateOutcomeEnabled = false,
}: {
  simulateOutcomeEnabled?: boolean;
}) {
  const [state, setState] = React.useState<CapitalAllocationPlan | null | "err" | "loading">("loading");
  const [disclaimer, setDisclaimer] = React.useState("");

  React.useEffect(() => {
    let cancel = false;
    void (async () => {
      const params = new URLSearchParams({ windowDays: "14" });
      const res = await fetch(`/api/growth/capital-allocation/plan?${params}`, { credentials: "same-origin" });
      if (cancel) return;
      if (!res.ok) {
        setState("err");
        return;
      }
      const j = (await res.json()) as { plan: CapitalAllocationPlan; disclaimer?: string };
      setState(j.plan);
      setDisclaimer(j.disclaimer ?? "");
    })();
    return () => {
      cancel = true;
    };
  }, []);

  if (state === "loading") {
    return (
      <section className="rounded-xl border border-emerald-900/35 bg-emerald-950/10 p-4" data-growth-capital-allocation>
        <p className="text-xs text-zinc-500">Loading capital allocation…</p>
      </section>
    );
  }

  if (state === "err" || !state) {
    return (
      <section className="rounded-xl border border-emerald-900/35 bg-emerald-950/10 p-4" data-growth-capital-allocation>
        <p className="text-sm text-amber-200/90">
          Capital allocation unavailable — enable allocation flags and ensure growth machine access.
        </p>
      </section>
    );
  }

  return (
    <section className="rounded-xl border border-emerald-800/45 bg-emerald-950/15 p-4" data-growth-capital-allocation>
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.15em] text-emerald-300/90">Strategy</p>
        <h3 className="mt-1 text-lg font-semibold text-zinc-100">Capital allocation (internal)</h3>
        <p className="mt-1 max-w-3xl text-[11px] text-zinc-500">{disclaimer}</p>
        {simulateOutcomeEnabled ? (
          <button
            type="button"
            className="mt-2 text-[11px] text-emerald-400/90 hover:underline"
            onClick={() =>
              presetAndScrollToActionSimulation({
                title: "Stress-test current allocation priorities",
                category: "demand_generation",
                rationale: "Opened from capital allocation — compare directional effects before shifting focus.",
                windowDays: 14,
                intensity: "medium",
              })
            }
          >
            Simulate outcome →
          </button>
        ) : null}
      </div>

      <p className="mt-2 text-[11px] text-zinc-500">
        Generated {new Date(state.generatedAt).toLocaleString()} · ranked targets are relative priorities, not budgets.
      </p>

      {state.topFocusAreas.length ? (
        <div className="mt-4 rounded-lg border border-emerald-900/40 bg-black/25 p-3">
          <p className="text-xs font-semibold text-emerald-400/90">Top focus areas</p>
          <ul className="mt-2 list-inside list-disc text-sm text-zinc-300">
            {state.topFocusAreas.map((x) => (
              <li key={x}>{x}</li>
            ))}
          </ul>
        </div>
      ) : null}

      {state.deprioritizedAreas.length ? (
        <div className="mt-4 rounded-lg border border-zinc-800 bg-black/20 p-3">
          <p className="text-xs font-semibold text-zinc-400">Deprioritized / watch</p>
          <ul className="mt-2 list-inside list-disc text-sm text-zinc-500">
            {state.deprioritizedAreas.map((x) => (
              <li key={x}>{x}</li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className="mt-4 space-y-4">
        {state.recommendations.map((r) => (
          <div key={`${r.bucket.id}-${r.target}`} className="rounded-lg border border-zinc-800 bg-black/25 p-3">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">{r.bucket.label}</p>
                <p className="text-base font-semibold text-zinc-100">{r.target}</p>
              </div>
              <div className="text-right text-[11px] text-zinc-400">
                <div>Priority {r.priorityScore}</div>
                {r.allocationShare != null ? <div>Share ≈ {(r.allocationShare * 100).toFixed(1)}%</div> : null}
              </div>
            </div>
            <p className="mt-2 text-xs text-zinc-400">{r.bucket.description}</p>
            <div className="mt-3 grid gap-2 text-[11px] sm:grid-cols-3">
              <div>
                <span className="text-zinc-500">Effort </span>
                <span className="capitalize text-zinc-300">{r.effortLevel}</span>
              </div>
              <div>
                <span className="text-zinc-500">Confidence </span>
                <span className="capitalize text-zinc-300">{r.confidence}</span>
              </div>
            </div>
            <p className="mt-3 text-sm text-zinc-300">{r.rationale}</p>
            <div className="mt-3 grid gap-3 md:grid-cols-2">
              <div>
                <p className="text-[10px] font-semibold uppercase text-zinc-500">Supporting signals</p>
                <ul className="mt-1 list-inside list-disc text-[11px] text-zinc-400">
                  {r.supportingSignals.map((s) => (
                    <li key={s}>{s}</li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="text-[10px] font-semibold uppercase text-amber-400/90">Warnings</p>
                <ul className="mt-1 list-inside list-disc text-[11px] text-amber-200/80">
                  {r.warnings.map((w) => (
                    <li key={w}>{w}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        ))}
      </div>

      {state.insights.length ? (
        <div className="mt-4 rounded-lg border border-zinc-800 bg-black/20 p-3">
          <p className="text-xs font-semibold text-zinc-400">Insights</p>
          <ul className="mt-2 space-y-2 text-sm text-zinc-400">
            {state.insights.map((i) => (
              <li key={i}>{i}</li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className="mt-4 rounded-lg border border-red-900/25 bg-black/30 p-3 text-[11px] text-zinc-500">
        <p className="font-semibold text-red-300/90">Risks & limits</p>
        <ul className="mt-2 list-inside list-disc">
          <li>No guaranteed growth, ROI, or automated spending — operator judgment required.</li>
          <li>Missing layers stay undefined upstream; scores are normalized only across available inputs.</li>
        </ul>
      </div>
    </section>
  );
}
