"use client";

import type { PricingPlanDefinition } from "@/modules/business/pricing-model.types";

export function HostPricingPlans({
  plans,
  featured,
}: {
  plans: PricingPlanDefinition[];
  featured: { label: string; durationDays: number; priceCents: number }[];
}) {
  return (
    <section className="px-4 py-14 sm:px-6">
      <h2 className="text-center font-serif text-2xl text-white">Plans & boosts</h2>
      <p className="mx-auto mt-2 max-w-xl text-center text-sm text-slate-500">
        Configurable product economics — confirm at checkout. Boosts are optional visibility add-ons.
      </p>
      <div className="mx-auto mt-10 grid max-w-5xl gap-6 md:grid-cols-3">
        {plans.map((p) => (
          <div key={p.planKey} className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
            <p className="text-xs font-semibold uppercase tracking-wide text-premium-gold">{p.displayName}</p>
            <p className="mt-2 text-sm text-slate-400">
              Booking fee ~{(p.bookingFeePercent * 100).toFixed(1)}%
              {p.monthlySubscriptionCents > 0 ?
                ` + $${(p.monthlySubscriptionCents / 100).toFixed(0)}/mo (Growth)`
              : null}
            </p>
            <ul className="mt-4 space-y-2 text-sm text-slate-300">
              {p.includedFeatures.map((f) => (
                <li key={f}>· {f}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="mx-auto mt-10 max-w-3xl rounded-xl border border-premium-gold/20 bg-black/40 p-6">
        <p className="text-sm font-semibold text-premium-gold">Featured boosts</p>
        <ul className="mt-3 flex flex-wrap gap-4 text-sm text-slate-300">
          {featured.map((f) => (
            <li key={f.label}>
              {f.label} — ${(f.priceCents / 100).toFixed(0)} CAD
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
