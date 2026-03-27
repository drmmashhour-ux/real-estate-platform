export function RecommendationBanner({
  recommendation,
  confidence,
}: {
  recommendation: string;
  confidence: "low" | "medium" | "high";
}) {
  const cls =
    confidence === "high"
      ? "border-emerald-500/40 bg-emerald-500/10"
      : confidence === "medium"
        ? "border-amber-500/40 bg-amber-500/10"
        : "border-rose-500/40 bg-rose-500/10";
  return (
    <div className={`rounded-xl border p-4 ${cls}`}>
      <p className="text-xs uppercase tracking-wide text-slate-200">Recommendation</p>
      <p className="mt-1 text-lg font-semibold text-white">{recommendation}</p>
      <p className="mt-1 text-sm text-slate-300">Confidence: {confidence}</p>
    </div>
  );
}
