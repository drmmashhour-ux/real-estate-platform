"use client";

import { useState } from "react";
import Link from "next/link";
import { PricingCard } from "./PricingCard";
import { PricingToggle } from "./PricingToggle";
import type { BillingPeriod, PricingHubId, PublicPlanDefinition } from "@/lib/pricing/public-catalog";
import { buildPlanCheckoutHref, planCtaLabel, planPriceDisplay } from "@/lib/pricing/public-catalog";

type PricingCatalogSectionProps = {
  hub: PricingHubId;
  eyebrow?: string;
  /** Section heading; omit on hub detail pages that already use a page hero */
  title?: string;
  subtitle?: string;
  plans: PublicPlanDefinition[];
  /** Link to full hub pricing page */
  detailsHref?: string;
  detailsLabel?: string;
};

export function PricingCatalogSection({
  hub,
  eyebrow,
  title,
  subtitle,
  plans,
  detailsHref,
  detailsLabel = "View full comparison",
}: PricingCatalogSectionProps) {
  const [billing, setBilling] = useState<BillingPeriod>("monthly");

  const hasHeading = Boolean(title || subtitle || eyebrow);

  return (
    <section className="scroll-mt-28">
      <div
        className={`flex flex-col gap-4 sm:flex-row sm:items-end ${hasHeading ? "sm:justify-between" : "sm:justify-end"}`}
      >
        {hasHeading ? (
          <div>
            {eyebrow ? (
              <p className="text-xs font-semibold uppercase tracking-wider text-premium-gold/90">{eyebrow}</p>
            ) : null}
            {title ? (
              <h2 className="mt-1 font-serif text-2xl font-semibold text-white sm:text-3xl">{title}</h2>
            ) : null}
            {subtitle ? <p className="mt-2 max-w-2xl text-sm text-slate-400">{subtitle}</p> : null}
          </div>
        ) : null}
        <PricingToggle value={billing} onChange={setBilling} className="shrink-0" />
      </div>
      <div
        className={`mt-10 grid gap-6 ${
          plans.length >= 4 ? "lg:grid-cols-4" : plans.length === 3 ? "lg:grid-cols-3" : "md:grid-cols-2"
        }`}
      >
        {plans.map((plan) => {
          const { main, sub } = planPriceDisplay(plan, billing);
          const href = buildPlanCheckoutHref(hub, plan.id, billing);
          return (
            <PricingCard
              key={plan.id}
              name={plan.name}
              description={plan.description}
              priceLabel={main}
              priceSub={sub}
              features={plan.features}
              href={href}
              ctaLabel={planCtaLabel(plan)}
              highlighted={plan.highlighted}
              badge={plan.badge}
            />
          );
        })}
      </div>
      {detailsHref ? (
        <div className="mt-8 text-center">
          <Link
            href={detailsHref}
            className="text-sm font-medium text-premium-gold transition hover:text-[#d4b45c] hover:underline"
          >
            {detailsLabel} →
          </Link>
        </div>
      ) : null}
    </section>
  );
}
