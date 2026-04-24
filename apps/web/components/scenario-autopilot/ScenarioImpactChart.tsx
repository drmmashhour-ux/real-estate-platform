import type { NormalizedSimulationOutput } from "@/modules/scenario-autopilot/scenario-autopilot.types";

const ROWS: Array<{ key: keyof NormalizedSimulationOutput; label: string }> = [
  { key: "revenueDelta", label: "Revenue Δ%" },
  { key: "conversionDelta", label: "Conversion Δ" },
  { key: "disputeRiskDelta", label: "Dispute risk Δ" },
  { key: "trustImpact", label: "Trust" },
  { key: "workloadImpact", label: "Workload %" },
  { key: "noShowImpact", label: "No-show proxy" },
  { key: "operationalComplexity", label: "Complexity" },
];

function Bar(props: { value: number; max: number }) {
  const w = Math.min(100, (Math.abs(props.value) / props.max) * 100);
  return (
    <div className="h-2 w-full rounded bg-neutral-800">
      <div
        className={`h-2 rounded ${props.value >= 0 ? "bg-emerald-600/80" : "bg-red-600/80"}`}
        style={{ width: `${w}%` }}
      />
    </div>
  );
}

export function ScenarioImpactChart(props: { metrics: NormalizedSimulationOutput }) {
  const m = props.metrics;
  const max = 40;
  return (
    <div className="space-y-3">
      {ROWS.map((r) => (
        <div key={r.key}>
          <div className="flex justify-between text-xs text-neutral-500">
            <span>{r.label}</span>
            <span className="text-[#f4efe4]">{m[r.key].toFixed(1)}</span>
          </div>
          <Bar value={m[r.key]} max={max} />
        </div>
      ))}
    </div>
  );
}
