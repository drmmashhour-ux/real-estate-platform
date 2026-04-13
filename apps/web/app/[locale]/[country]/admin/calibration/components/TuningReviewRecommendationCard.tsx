"use client";

export function TuningReviewRecommendationCard({
  recommended,
  reasons,
}: {
  recommended: boolean;
  reasons: string[];
}) {
  return (
    <div
      className={`rounded-xl border p-4 ${recommended ? "border-amber-700/60 bg-amber-950/30" : "border-zinc-800 bg-zinc-950/50"}`}
    >
      <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-500">Tuning review</p>
      <p className={`mt-1 text-lg font-bold ${recommended ? "text-amber-200" : "text-zinc-300"}`}>
        {recommended ? "Review recommended" : "No automatic review trigger"}
      </p>
      <ul className="mt-2 list-inside list-disc space-y-1 text-sm text-zinc-400">
        {reasons.map((r, i) => (
          <li key={`${i}-${r}`}>{r}</li>
        ))}
      </ul>
    </div>
  );
}
