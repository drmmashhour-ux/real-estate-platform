type Tier = "high" | "medium" | "low";

export function TrustBadge({ score, tier }: { score: number; tier: Tier }) {
  const colors =
    tier === "high"
      ? "bg-emerald-500/15 text-emerald-200 ring-emerald-500/35"
      : tier === "medium"
        ? "bg-amber-500/15 text-amber-100 ring-amber-500/35"
        : "bg-slate-600/25 text-slate-200 ring-slate-500/35";

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ${colors}`}
      title="BNHUB trust score blends verification, reviews, and listing completeness."
    >
      <span className="tabular-nums font-semibold">{score}</span>
      <span className="text-[10px] uppercase tracking-wide opacity-90">Trust</span>
    </span>
  );
}
