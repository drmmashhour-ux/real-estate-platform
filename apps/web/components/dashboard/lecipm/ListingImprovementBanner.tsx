type Props = {
  improvementPct: number | null;
};

/** Compares earliest vs latest ListingAiScore trust for this listing (when history exists). */
export function ListingImprovementBanner({ improvementPct }: Props) {
  if (improvementPct == null || improvementPct <= 0) return null;
  return (
    <div className="rounded-xl border border-emerald-500/30 bg-emerald-950/25 px-4 py-3 text-sm text-emerald-100/95">
      <span className="font-semibold text-emerald-200">Listing quality up ~{improvementPct}%</span>
      <span className="text-emerald-200/80"> — vs your first saved score snapshot. Informational only.</span>
    </div>
  );
}
