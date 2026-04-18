"use client";

/**
 * Pricing recommendation card — data must come from GET /api/listings/[id]/pricing (never client-side guesswork).
 */
export type PricingInsightCardProps = {
  recommendedPriceLabel: string;
  confidenceLabel: string;
  summary?: string | null;
  bullets?: string[];
  className?: string;
};

export function PricingInsightCard({
  recommendedPriceLabel,
  confidenceLabel,
  summary,
  bullets,
  className = "",
}: PricingInsightCardProps) {
  return (
    <section
      className={`rounded-2xl border border-white/10 bg-black/40 p-5 shadow-[0_8px_30px_-12px_rgba(0,0,0,0.55)] ${className}`}
    >
      <p className="text-[11px] font-semibold uppercase tracking-wide text-premium-gold">Pricing insight</p>
      <p className="mt-2 text-2xl font-bold tracking-tight text-white">{recommendedPriceLabel}</p>
      <p className="mt-1 text-xs text-slate-400">Confidence: {confidenceLabel}</p>
      {summary ? <p className="mt-3 text-sm leading-relaxed text-slate-300">{summary}</p> : null}
      {bullets && bullets.length > 0 ? (
        <ul className="mt-3 list-inside list-disc space-y-1 text-xs text-slate-400">
          {bullets.slice(0, 6).map((b) => (
            <li key={b.slice(0, 40)}>{b}</li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}
