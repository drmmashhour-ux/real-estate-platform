"use client";

/**
 * Revenue framing — pass through server-computed copy only (no fabricated dollar claims).
 */
export type RevenueOpportunityCardProps = {
  title?: string;
  body: string;
  className?: string;
};

export function RevenueOpportunityCard({
  title = "Revenue opportunity",
  body,
  className = "",
}: RevenueOpportunityCardProps) {
  return (
    <section className={`rounded-2xl border border-premium-gold/25 bg-premium-gold/[0.06] p-5 ${className}`}>
      <p className="text-[11px] font-semibold uppercase tracking-wide text-premium-gold">{title}</p>
      <p className="mt-2 text-sm leading-relaxed text-slate-200">{body}</p>
    </section>
  );
}
