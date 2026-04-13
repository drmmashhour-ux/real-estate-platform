import type { BnhubDealSummaryDto } from "@/modules/deal-analyzer/domain/contracts";

export function BnHubOpportunityCard({ data }: { data: BnhubDealSummaryDto }) {
  return (
    <div className="rounded-2xl border border-cyan-500/20 bg-cyan-500/[0.04] p-5">
      <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-cyan-200/90">BNHUB short-term overlay</p>
      <p className="mt-2 text-sm font-semibold text-white">{data.recommendation.replace(/_/g, " ")}</p>
      <p className="mt-1 text-xs text-slate-400">Confidence: {data.confidenceLevel}</p>
      {data.monthlyNetOperatingCents != null ? (
        <p className="mt-3 text-sm text-slate-300">
          Est. monthly net (rules-based):{" "}
          <span className="text-white">${(data.monthlyNetOperatingCents / 100).toLocaleString()}</span>
        </p>
      ) : null}
      {data.warnings.slice(0, 2).map((w) => (
        <p key={w} className="mt-2 text-xs text-amber-200/90">
          {w}
        </p>
      ))}
    </div>
  );
}
