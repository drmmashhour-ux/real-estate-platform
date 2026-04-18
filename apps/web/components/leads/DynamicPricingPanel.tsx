"use client";

import type { DynamicPricingSuggestion } from "@/modules/leads/dynamic-pricing.types";

export function DynamicPricingPanel({ suggestion }: { suggestion: DynamicPricingSuggestion }) {
  return (
    <section className="rounded-2xl border border-amber-500/25 bg-[#1a1206] p-5">
      <p className="text-xs font-semibold uppercase tracking-wider text-amber-200/95">Dynamic pricing (advisory V1)</p>
      <p className="mt-1 text-[11px] text-[#737373]">
        Suggested amounts are not applied to Stripe checkout — revenue engine base price is unchanged at payment time.
      </p>
      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <div>
          <p className="text-[10px] uppercase text-[#737373]">Base (revenue engine)</p>
          <p className="text-xl font-bold tabular-nums text-white">
            ${suggestion.basePrice.toLocaleString()} <span className="text-xs font-normal text-[#737373]">CAD</span>
          </p>
        </div>
        <div>
          <p className="text-[10px] uppercase text-[#737373]">Suggested (dynamic)</p>
          <p className="text-xl font-bold tabular-nums text-amber-200">
            ${suggestion.suggestedPrice.toLocaleString()} <span className="text-xs font-normal text-[#737373]">CAD</span>
          </p>
        </div>
        <div>
          <p className="text-[10px] uppercase text-[#737373]">Multiplier (capped)</p>
          <p className="text-xl font-bold tabular-nums text-white">×{suggestion.priceMultiplier.toFixed(3)}</p>
          <p className="text-[10px] text-[#737373]">Demand: {suggestion.demandLevel}</p>
        </div>
      </div>
      {suggestion.reason.length > 0 ? (
        <ul className="mt-4 list-inside list-disc space-y-1 text-xs text-[#B3B3B3]">
          {suggestion.reason.map((r, i) => (
            <li key={`${i}-${r.slice(0, 48)}`}>{r}</li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}
