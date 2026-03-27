import type { DealAnalysisPublicDto } from "@/modules/deal-analyzer/domain/contracts";

export function DealRiskPanel({ dto }: { dto: DealAnalysisPublicDto }) {
  const riskLabel = dto.riskLevel === "low" ? "Low" : dto.riskLevel === "medium" ? "Medium" : "High";
  const riskCls =
    dto.riskLevel === "low"
      ? "text-emerald-300"
      : dto.riskLevel === "medium"
        ? "text-amber-200"
        : "text-red-300";

  return (
    <div className="rounded-xl border border-white/10 bg-[#121212] p-4">
      <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#A1A1A1]">Risk</p>
      <p className={`mt-1 text-lg font-semibold ${riskCls}`}>
        {riskLabel}{" "}
        <span className="text-sm font-normal text-[#A1A1A1]">({dto.riskScore}/100)</span>
      </p>
      <p className="mt-2 text-xs text-[#A1A1A1]">Higher score = more flagged risk from documentation, pricing, and trust signals.</p>
    </div>
  );
}
