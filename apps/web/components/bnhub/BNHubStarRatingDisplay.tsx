import type { ClassificationBreakdownCore } from "@/src/modules/bnhub-growth-engine/services/propertyClassificationService";

function starsVisual(rating: number): string {
  const r = Math.max(0, Math.min(5, Math.round(rating)));
  return "★".repeat(r) + "☆".repeat(5 - r);
}

function breakdownTooltipText(b: ClassificationBreakdownCore): string {
  const lines = [
    `${b.label}`,
    `Score ${b.overallScore}/100 (base ${b.baseScore} + AI adj ${b.aiAdjustment.value >= 0 ? "+" : ""}${b.aiAdjustment.value})`,
    `Amenities ${b.amenities.earned}/${b.amenities.max} · Comfort ${b.comfort.earned}/${b.comfort.max} · Services ${b.services.earned}/${b.services.max}`,
    `Safety ${b.safety.earned}/${b.safety.max} · Completeness ${b.completeness.earned}/${b.completeness.max} · Luxury ${b.luxury.earned}/${b.luxury.max}`,
  ];
  return lines.join("\n");
}

export function BNHubStarRatingDisplay({
  breakdown,
}: {
  breakdown: ClassificationBreakdownCore | null;
}) {
  if (!breakdown) {
    return (
      <p className="text-xs text-slate-500">
        BNHUB rating is being calculated — refresh in a moment.
      </p>
    );
  }

  return (
    <div className="rounded-lg border border-amber-500/25 bg-amber-950/20 px-3 py-2">
      <p className="text-[11px] font-medium uppercase tracking-wide text-amber-200/90">BNHUB Rating</p>
      <div className="mt-1 flex flex-wrap items-center gap-2">
        <span className="text-lg tracking-tight text-amber-300" aria-label={`${breakdown.starRating} out of 5 stars`}>
          {starsVisual(breakdown.starRating)}
        </span>
        <span className="text-sm text-slate-200">{breakdown.starRating} / 5</span>
        <span
          className="cursor-help text-xs text-slate-500 underline decoration-dotted decoration-slate-600"
          title={breakdownTooltipText(breakdown)}
        >
          {breakdown.label}
        </span>
      </div>
      <p className="mt-1 text-[11px] text-slate-500">
        Internal platform estimate from listing content and amenities — not an official hotel star classification.
      </p>
    </div>
  );
}
