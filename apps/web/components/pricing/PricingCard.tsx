import Link from "next/link";
import { PricingFeatureList } from "./PricingFeatureList";
import type { PublicPlanBadge } from "@/lib/pricing/public-catalog";

type PricingCardProps = {
  name: string;
  description: string;
  priceLabel: string;
  priceSub?: string;
  features: string[];
  href: string;
  ctaLabel: string;
  highlighted?: boolean;
  badge?: PublicPlanBadge;
};

const badgeText: Record<PublicPlanBadge, string> = {
  "most-popular": "Most popular",
  "best-value": "Best value",
};

export function PricingCard({
  name,
  description,
  priceLabel,
  priceSub,
  features,
  href,
  ctaLabel,
  highlighted,
  badge,
}: PricingCardProps) {
  return (
    <div
      className={`flex h-full flex-col rounded-2xl border p-6 sm:p-8 ${
        highlighted
          ? "border-premium-gold/55 bg-gradient-to-b from-premium-gold/12 via-black/40 to-black/60 shadow-xl shadow-premium-gold/10 ring-1 ring-premium-gold/25"
          : "border-white/10 bg-white/[0.02]"
      }`}
    >
      <div className="min-h-[3rem]">
        {badge ? (
          <p className="text-xs font-semibold uppercase tracking-wider text-premium-gold">{badgeText[badge]}</p>
        ) : (
          <span className="block h-4" aria-hidden />
        )}
      </div>
      <h3 className="mt-1 font-serif text-2xl font-semibold text-white">{name}</h3>
      <p className="mt-1 text-sm text-slate-400">{description}</p>
      <div className="mt-5">
        <p className="text-3xl font-bold tracking-tight text-premium-gold">{priceLabel}</p>
        {priceSub ? <p className="mt-1 text-xs text-slate-500">{priceSub}</p> : null}
      </div>
      <PricingFeatureList features={features} className="mt-6 flex-1" />
      <Link
        href={href}
        className={`mt-8 inline-flex w-full items-center justify-center rounded-xl px-5 py-3.5 text-center text-sm font-semibold transition ${
          highlighted
            ? "bg-gradient-to-r from-premium-gold via-[#d4b45c] to-[#a88a2e] text-black shadow-lg shadow-premium-gold/25 hover:brightness-110"
            : "border border-white/20 text-white hover:border-premium-gold/50 hover:bg-white/5"
        }`}
      >
        {ctaLabel}
      </Link>
    </div>
  );
}
