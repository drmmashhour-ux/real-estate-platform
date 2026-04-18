"use client";

import { Sparkles } from "lucide-react";
import type { ListingDemandUiPayload } from "@/lib/listings/listing-analytics-service";

/**
 * Uses only real signals already computed for the page (demand UI + listing fields).
 */
export function ListingWhyOpportunitySection({
  city,
  demandUi,
}: {
  city: string;
  demandUi: ListingDemandUiPayload | null;
}) {
  const bullets: { key: string; text: string }[] = [];

  if (demandUi?.pricingInsight?.headline) {
    bullets.push({ key: "price", text: `Price analysis: ${demandUi.pricingInsight.headline}` });
  }
  if (city.trim()) {
    bullets.push({
      key: "loc",
      text: `Location: ${city.trim()} — validate schools, transit, and comps with the listing representative.`,
    });
  }
  if (demandUi?.badge) {
    bullets.push({ key: "demand", text: `Demand insight: ${demandUi.badge}` });
  } else if (demandUi?.activityHint) {
    bullets.push({ key: "activity", text: demandUi.activityHint });
  }

  if (bullets.length === 0) return null;

  return (
    <section
      className="mt-6 rounded-2xl border border-[#D4AF37]/25 bg-gradient-to-br from-[#D4AF37]/[0.07] to-black/50 p-5"
      aria-labelledby="why-opportunity-title"
    >
      <h2 id="why-opportunity-title" className="text-lg font-semibold tracking-tight text-[#D4AF37]">
        Why this is a good opportunity
      </h2>
      <ul className="mt-3 space-y-2.5 text-sm leading-relaxed text-white/85">
        {bullets.map((b) => (
          <li key={b.key} className="flex gap-2.5">
            <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-[#D4AF37]/90" aria-hidden />
            <span>{b.text}</span>
          </li>
        ))}
      </ul>
      <p className="mt-3 text-[11px] leading-snug text-white/45">
        Illustrative only — not investment advice. Confirm details with a licensed professional.
      </p>
    </section>
  );
}
