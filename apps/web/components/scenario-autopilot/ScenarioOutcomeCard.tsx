import type { OutcomeRecord } from "@/modules/scenario-autopilot/scenario-autopilot.types";

export function ScenarioOutcomeCard(props: { outcome: OutcomeRecord }) {
  const o = props.outcome;
  return (
    <div className="rounded-lg border border-[#2a2a2a] bg-[#0a0a0a] p-4 text-sm text-neutral-300">
      <p className="text-xs font-semibold uppercase text-neutral-500">Measured outcome</p>
      <p className="mt-2">Window: {o.windowDays}d · match: {o.didItMatchPrediction}</p>
      <ul className="mt-2 list-disc pl-4 text-xs">
        <li>Leads Δ {o.delta.leads}</li>
        <li>Conversion Δ {o.delta.conversionPct} pts</li>
        <li>Revenue proxy Δ {o.delta.revenueProxyPct.toFixed(1)}%</li>
        <li>Open disputes Δ {o.delta.disputeCount}</li>
        {o.delta.trust != null ? <li>Trust Δ {o.delta.trust}</li> : null}
      </ul>
    </div>
  );
}
