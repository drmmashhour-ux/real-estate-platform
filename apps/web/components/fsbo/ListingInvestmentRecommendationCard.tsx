import type { ListingInvestmentRecommendation } from "@/lib/fsbo/listing-investment-recommendation";

function toneClasses(tone: ListingInvestmentRecommendation["tone"]): string {
  switch (tone) {
    case "positive":
      return "border-emerald-500/40 bg-emerald-950/25 text-emerald-100";
    case "caution":
      return "border-amber-500/40 bg-amber-950/25 text-amber-100";
    case "warning":
      return "border-red-500/40 bg-red-950/30 text-red-100";
    default:
      return "border-white/15 bg-[#141414] text-slate-200";
  }
}

function chipToneClasses(tone: ListingInvestmentRecommendation["tone"]): string {
  switch (tone) {
    case "positive":
      return "border-emerald-500/50 bg-emerald-950/50 text-emerald-200";
    case "caution":
      return "border-amber-500/50 bg-amber-950/40 text-amber-100";
    case "warning":
      return "border-red-500/50 bg-red-950/45 text-red-100";
    default:
      return "border-white/20 bg-black/50 text-slate-200";
  }
}

export function ListingInvestmentRecommendationCard({
  recommendation,
  compact = false,
}: {
  recommendation: ListingInvestmentRecommendation | null;
  compact?: boolean;
}) {
  if (!recommendation) {
    return (
      <div className="rounded-2xl border border-white/10 bg-[#121212] p-4 text-sm text-slate-500">
        AI-style insight appears when risk/trust scores or price signals are available — not investment advice.
      </div>
    );
  }

  const { label, summary, factors, tone } = recommendation;

  return (
    <div className={`rounded-2xl border px-4 py-4 text-sm ${toneClasses(tone)}`}>
      <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-white/70">AI recommendation</p>
      <p className={`mt-2 font-serif text-lg font-semibold ${compact ? "" : "sm:text-xl"}`}>{label}</p>
      <p className="mt-2 text-sm leading-relaxed opacity-95">{summary}</p>
      {!compact && factors.length > 0 ? (
        <ul className="mt-3 list-inside list-disc space-y-1 text-xs text-white/80">
          {factors.slice(0, 5).map((f, i) => (
            <li key={i}>{f}</li>
          ))}
        </ul>
      ) : null}
      <p className="mt-3 text-[11px] text-white/55">
        Estimates from platform data and rules — not financial, legal, or investment advice.
      </p>
    </div>
  );
}

export function ListingInvestmentRecommendationChip({
  recommendation,
}: {
  recommendation: ListingInvestmentRecommendation | null;
}) {
  if (!recommendation) return null;
  return (
    <span
      className={`inline-flex max-w-full items-center rounded-lg border px-2.5 py-1 text-[11px] font-semibold tracking-wide ${chipToneClasses(recommendation.tone)}`}
      title={recommendation.summary}
    >
      {recommendation.label}
    </span>
  );
}
