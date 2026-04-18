"use client";

import { useCallback, useState } from "react";
import type { BudgetEngineResult } from "@/modules/growth-strategy/budget-engine.service";
import type { PerformanceSimulationResult } from "@/modules/growth-strategy/performance-simulator";

type Props = {
  initialBudget: number;
  initialAllocation: BudgetEngineResult;
  initialSimulation: PerformanceSimulationResult;
};

export function GrowthLaunchBudgetClient({ initialBudget, initialAllocation, initialSimulation }: Props) {
  const [budget, setBudget] = useState(initialBudget);
  const [allocation, setAllocation] = useState(initialAllocation);
  const [simulation, setSimulation] = useState(initialSimulation);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const refresh = useCallback(async (next: number) => {
    setLoading(true);
    setErr(null);
    try {
      const res = await fetch("/api/growth/budget", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ totalBudget: next, city: "Montreal", avgBookingValueCad: 185, bnhubTakeRate: 0.12 }),
      });
      const j = (await res.json()) as {
        error?: string;
        allocation?: BudgetEngineResult;
        simulation?: PerformanceSimulationResult;
      };
      if (!res.ok) {
        setErr(j.error ?? "Request failed");
        return;
      }
      if (j.allocation) setAllocation(j.allocation);
      if (j.simulation) setSimulation(j.simulation);
    } catch {
      setErr("Network error");
    } finally {
      setLoading(false);
    }
  }, []);

  return (
    <div className="space-y-4 rounded-2xl border border-zinc-800 bg-zinc-950/80 p-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-white">Budget allocation & simulation</h2>
          <p className="text-xs text-zinc-500">
            Conservative CPC/CVR — validate against Admin Analytics + Stripe. BNHub revenue uses take-rate proxy.
          </p>
        </div>
        <label className="text-sm text-zinc-400">
          Total budget (CAD)
          <input
            type="range"
            min={500}
            max={1000}
            step={25}
            value={budget}
            disabled={loading}
            onChange={(e) => {
              const v = Number(e.target.value);
              setBudget(v);
              void refresh(v);
            }}
            className="ml-3 align-middle"
          />
          <span className="ml-2 font-mono text-white">${budget}</span>
        </label>
      </div>
      {err ? <p className="text-sm text-red-400">{err}</p> : null}
      {loading ? <p className="text-xs text-zinc-500">Updating…</p> : null}

      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] text-left text-sm text-zinc-400">
          <thead>
            <tr className="border-b border-zinc-800 text-xs uppercase text-zinc-600">
              <th className="py-2 pr-2">Campaign</th>
              <th className="py-2 pr-2">Budget</th>
              <th className="py-2 pr-2">Target</th>
              <th className="py-2 pr-2">Est. clicks</th>
              <th className="py-2 pr-2">Est. conv.</th>
            </tr>
          </thead>
          <tbody>
            {allocation.campaigns.map((c) => {
              const sim = simulation.rows.find((r) => r.id === c.id);
              return (
                <tr key={c.id} className="border-b border-zinc-800/80">
                  <td className="py-2 pr-2 text-zinc-200">{c.name}</td>
                  <td className="py-2 pr-2">${c.budgetCad.toFixed(2)}</td>
                  <td className="py-2 pr-2 font-mono text-xs">{c.target}</td>
                  <td className="py-2 pr-2">{sim?.estimatedClicks ?? c.expectedClicks}</td>
                  <td className="py-2 pr-2">{sim?.estimatedConversions ?? c.expectedConversions}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-zinc-800 bg-black/40 p-4">
          <p className="text-xs text-zinc-500">Total est. revenue (BNHub proxy)</p>
          <p className="mt-1 text-xl font-semibold text-emerald-400/90">
            ${simulation.totals.estimatedRevenueCad.toFixed(2)}
          </p>
        </div>
        <div className="rounded-xl border border-zinc-800 bg-black/40 p-4">
          <p className="text-xs text-zinc-500">Blended ROI (revenue / spend)</p>
          <p className="mt-1 text-xl font-semibold text-white">
            {simulation.totals.blendedRoi != null ? `${simulation.totals.blendedRoi}×` : "—"}
          </p>
        </div>
        <div className="rounded-xl border border-zinc-800 bg-black/40 p-4">
          <p className="text-xs text-zinc-500">Formula</p>
          <p className="mt-1 text-[11px] leading-snug text-zinc-600">{simulation.formula}</p>
        </div>
      </div>
    </div>
  );
}
