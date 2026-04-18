"use client";

import type { LaunchSimulationScenario } from "@/modules/launch-simulation/launch-simulation.types";

const SCENARIOS: LaunchSimulationScenario[] = ["conservative", "baseline", "optimistic"];

export function ScenarioTabs({
  active,
  onChange,
}: {
  active: LaunchSimulationScenario;
  onChange: (s: LaunchSimulationScenario) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2 rounded-xl border border-zinc-800 bg-zinc-950/60 p-1">
      {SCENARIOS.map((s) => (
        <button
          key={s}
          type="button"
          onClick={() => {
            void fetch("/api/founder/simulation/scenario-compare", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ from: active, to: s }),
            });
            onChange(s);
          }}
          className={`rounded-lg px-4 py-2 text-sm font-medium capitalize transition ${
            active === s ? "bg-amber-500/20 text-amber-100 ring-1 ring-amber-500/40" : "text-zinc-500 hover:text-zinc-300"
          }`}
        >
          {s}
        </button>
      ))}
    </div>
  );
}
