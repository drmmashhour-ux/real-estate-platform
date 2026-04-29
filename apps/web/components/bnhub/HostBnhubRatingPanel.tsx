import type { ClassificationBreakdown } from "@/types/bnhub-classification-client";
import { BNHubStarRatingDisplay } from "./BNHubStarRatingDisplay";

export function HostBnhubRatingPanel({
  breakdown,
}: {
  breakdown: ClassificationBreakdown | null;
}) {
  const core = breakdown
    ? {
        label: breakdown.label,
        amenities: breakdown.amenities,
        comfort: breakdown.comfort,
        services: breakdown.services,
        safety: breakdown.safety,
        completeness: breakdown.completeness,
        luxury: breakdown.luxury,
        aiAdjustment: breakdown.aiAdjustment,
        baseScore: breakdown.baseScore,
        overallScore: breakdown.overallScore,
        starRating: breakdown.starRating,
      }
    : null;

  return (
    <section className="rounded-xl border border-slate-800 bg-slate-900/40 p-4">
      <h2 className="text-sm font-semibold text-white">BNHUB star estimate</h2>
      <p className="mt-1 text-xs text-slate-500">
        Shown to guests as guidance only. Improve your listing to raise your score.
      </p>
      <div className="mt-3">
        <BNHubStarRatingDisplay breakdown={core} />
      </div>
      {breakdown && breakdown.improvementSuggestions.length > 0 ? (
        <div className="mt-4 border-t border-slate-800 pt-3">
          <p className="text-xs font-medium text-emerald-400">How to improve</p>
          <ul className="mt-2 list-inside list-disc text-xs text-slate-400">
            {breakdown.improvementSuggestions.map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  );
}
