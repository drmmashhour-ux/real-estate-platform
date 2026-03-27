export function RecommendationBadge({ recommendation }: { recommendation: string | null | undefined }) {
  const rec = (recommendation ?? "Monitoring").trim();
  const low = rec.toLowerCase();
  const cls =
    low.includes("strong")
      ? "border-emerald-400/40 bg-emerald-500/15 text-emerald-200"
      : low.includes("review") || low.includes("risk")
        ? "border-amber-400/40 bg-amber-500/15 text-amber-100"
        : "border-white/20 bg-white/5 text-slate-200";

  return <span className={`rounded-full border px-2 py-0.5 text-[10px] ${cls}`}>{rec}</span>;
}
