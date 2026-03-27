import type { PortfolioBucket } from "@/modules/deal-analyzer/domain/portfolio";

const LABEL: Record<string, string> = {
  top_opportunities: "Top opportunities",
  stable_candidates: "Stable candidates",
  needs_review: "Needs review",
  speculative: "Speculative",
};

export function PortfolioRankBadge({
  bucket,
  rank,
  total,
}: {
  bucket: PortfolioBucket | string | null;
  rank: number | null;
  total: number | null;
}) {
  if (!bucket) return null;
  const text = LABEL[bucket] ?? bucket.replace(/_/g, " ");
  return (
    <span className="inline-flex flex-wrap items-center gap-2 rounded-full border border-white/15 bg-white/[0.04] px-3 py-1 text-xs font-medium text-slate-200">
      {text}
      {rank != null && total != null ? (
        <span className="text-slate-500">
          rank {rank}/{total}
        </span>
      ) : null}
    </span>
  );
}
