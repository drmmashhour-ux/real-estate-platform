import type { SimulationScenarioResult } from "@/modules/e2e-simulation/e2e-simulation.types";

type Props = { scenario: SimulationScenarioResult };

function tone(s: SimulationScenarioResult["status"]) {
  if (s === "PASS") return "border-emerald-500/30 text-emerald-300";
  if (s === "FAIL") return "border-red-500/30 text-red-300";
  if (s === "WARNING") return "border-amber-500/30 text-amber-300";
  return "border-zinc-600 text-zinc-400";
}

export function ScenarioResultCard({ scenario }: Props) {
  return (
    <div className={`rounded-2xl border bg-zinc-950/40 p-4 ${tone(scenario.status)}`}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="font-semibold text-white">{scenario.scenarioName}</h3>
        <span className="rounded-md border border-zinc-700 px-2 py-0.5 text-xs">{scenario.status}</span>
      </div>
      <p className="mt-1 text-sm text-zinc-500">{scenario.summary}</p>
      <p className="mt-2 font-mono text-xs text-zinc-600">domain: {scenario.domain}</p>
    </div>
  );
}
