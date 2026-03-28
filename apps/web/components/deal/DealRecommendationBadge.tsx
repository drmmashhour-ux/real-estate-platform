import type { DealAnalysisPublicDto } from "@/modules/deal-analyzer/domain/contracts";

const LABEL: Record<string, string> = {
  strong_opportunity: "Strong opportunity",
  worth_reviewing: "Worth reviewing",
  caution: "Needs caution",
  avoid: "Avoid for now",
  insufficient_data: "Insufficient data",
};

export function DealRecommendationBadge({ recommendation }: { recommendation: DealAnalysisPublicDto["recommendation"] }) {
  const text = LABEL[recommendation] ?? recommendation;
  const cls =
    recommendation === "strong_opportunity"
      ? "border-emerald-500/40 bg-emerald-500/15 text-emerald-200"
      : recommendation === "worth_reviewing"
        ? "border-premium-gold/40 bg-premium-gold/10 text-premium-gold"
        : recommendation === "caution"
          ? "border-amber-500/40 bg-amber-500/10 text-amber-200"
          : recommendation === "insufficient_data"
            ? "border-slate-500/40 bg-slate-500/10 text-slate-200"
            : "border-red-500/40 bg-red-500/10 text-red-200";

  return (
    <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${cls}`}>{text}</span>
  );
}
