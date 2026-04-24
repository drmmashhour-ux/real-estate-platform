import type { LaunchRiskProfile } from "@/modules/launch-sequencer/launch-sequencer.types";

export function LaunchRiskPanel(props: { risk: LaunchRiskProfile }) {
  const { risk } = props;
  const band =
    risk.overallRisk === "high" ?
      "border-rose-500/30 bg-rose-950/20"
    : risk.overallRisk === "medium" ?
      "border-amber-500/30 bg-amber-950/20"
    : "border-emerald-500/25 bg-emerald-950/15";

  return (
    <div className={`rounded-xl border p-4 ${band}`}>
      <p className="text-[10px] font-semibold uppercase tracking-wide text-neutral-400">Risk profile (scenario)</p>
      <p className="mt-1 text-sm font-medium text-neutral-100">Overall: {risk.overallRisk}</p>
      <ul className="mt-3 space-y-2 text-xs text-neutral-300">
        {risk.risks.map((r) => (
          <li key={r.key}>
            <span className="font-medium text-neutral-200">{r.label}</span>
            <span className="text-neutral-500"> · {r.severity}</span>
            {r.rationale[0] ? <p className="mt-0.5 text-[11px] text-neutral-500">{r.rationale[0]}</p> : null}
          </li>
        ))}
      </ul>
    </div>
  );
}
