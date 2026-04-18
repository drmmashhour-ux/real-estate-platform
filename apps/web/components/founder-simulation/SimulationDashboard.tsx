"use client";

import { useCallback, useEffect, useState } from "react";
import type { LaunchSimulationScenario } from "@/modules/launch-simulation/launch-simulation.types";
import type { ThreeMonthProjection } from "@/modules/launch-simulation/launch-simulation.types";
import type { FounderMetricsSummaryRow } from "@/lib/founder-simulation-run";
import { ScenarioTabs } from "./ScenarioTabs";
import { RevenueProjectionCard } from "./RevenueProjectionCard";
import { RevenueBreakdownChart } from "./RevenueBreakdownChart";
import { UnitEconomicsCard } from "./UnitEconomicsCard";
import { AssumptionsEditor } from "./AssumptionsEditor";

type ApiSimulationState = {
  projections: Record<LaunchSimulationScenario, ThreeMonthProjection>;
  summaries: Record<LaunchSimulationScenario, FounderMetricsSummaryRow>;
};

export function SimulationDashboard({ basePath }: { basePath: string }) {
  const [scenario, setScenario] = useState<LaunchSimulationScenario>("baseline");
  const [data, setData] = useState<ApiSimulationState | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    const res = await fetch("/api/founder/simulation", { credentials: "include" });
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      setError(typeof j.error === "string" ? j.error : `HTTP ${res.status}`);
      return;
    }
    const j = (await res.json()) as ApiSimulationState & { kind?: string };
    setData({ projections: j.projections, summaries: j.summaries });
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  if (error) {
    return (
      <div className="rounded-2xl border border-red-900/50 bg-red-950/20 p-6 text-sm text-red-200/90">
        {error}
        <button type="button" className="ml-4 underline" onClick={() => void load()}>
          Retry
        </button>
      </div>
    );
  }

  if (!data) {
    return <p className="text-sm text-zinc-500">Loading simulation…</p>;
  }

  const proj = data.projections[scenario];
  const summary = data.summaries[scenario];

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <ScenarioTabs active={scenario} onChange={setScenario} />
        <div className="flex flex-wrap gap-2">
          <a
            href={`${basePath}/pitch`}
            className="rounded-lg border border-zinc-700 px-3 py-2 text-sm text-zinc-300 hover:border-amber-500/40 hover:text-amber-100"
          >
            Pitch wording →
          </a>
          <button
            type="button"
            onClick={() => {
              void fetch("/api/founder/export/simulation", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ format: "csv" }),
                credentials: "include",
              }).then(async (r) => {
                if (!r.ok) return;
                const blob = await r.blob();
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = "lecipm-simulation.csv";
                a.click();
                URL.revokeObjectURL(url);
              });
            }}
            className="rounded-lg border border-zinc-700 px-3 py-2 text-sm text-zinc-300 hover:border-emerald-500/40 hover:text-emerald-100"
          >
            Export CSV
          </button>
        </div>
      </div>

      <p className="text-xs text-zinc-500">
        All figures are <strong className="text-zinc-400">projected estimates</strong> from editable assumptions — not audited actuals.
      </p>

      <div className="grid gap-6 lg:grid-cols-2">
        <RevenueProjectionCard projection={proj} />
        <UnitEconomicsCard unitEconomics={summary.unitEconomics} />
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {proj.months.map((m) => (
          <RevenueBreakdownChart key={m.month} month={m} />
        ))}
      </div>

      <AssumptionsEditor scenario={scenario} onSaved={load} />
    </div>
  );
}
