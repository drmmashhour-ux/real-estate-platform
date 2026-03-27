import type { DealAnalysisPublicDto } from "@/modules/deal-analyzer/domain/contracts";

export function DealCashFlowPreview({ scenario }: { scenario: NonNullable<DealAnalysisPublicDto["scenarioPreview"]> }) {
  if (scenario.monthlyRent == null) return null;
  return (
    <div className="rounded-xl border border-white/10 bg-[#121212] p-4 text-sm text-[#A1A1A1]">
      <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500">Cash-flow hint (illustrative)</p>
      <p className="mt-2 text-white">
        ~${scenario.monthlyRent.toLocaleString()}/mo rule-of-thumb vs list price
        {scenario.occupancyRate != null ? ` · occupancy assumption ${Math.round(scenario.occupancyRate * 100)}%` : ""}
      </p>
      {scenario.note ? <p className="mt-2 text-xs">{scenario.note}</p> : null}
    </div>
  );
}
