import type { ThreeMonthProjection } from "@/modules/launch-simulation/launch-simulation.types";
import type { PitchSlide } from "./pitch-content.types";
import { PLATFORM_NAME } from "@/config/branding";

function money(n: number) {
  return n.toLocaleString("en-CA", { style: "currency", currency: "CAD", maximumFractionDigits: 0 });
}

export function buildSlide9ProjectionCopy(
  conservative: ThreeMonthProjection,
  baseline: ThreeMonthProjection,
  optimistic: ThreeMonthProjection
): PitchSlide {
  return {
    slideNumber: 9,
    title: "3-Month Revenue Projection (Montreal)",
    headline: "Scenario comparison — estimated platform revenue (not GAAP)",
    bullets: [
      `Conservative (3-month cumulative): ${money(conservative.cumulativeRevenueCad)}`,
      `Baseline: ${money(baseline.cumulativeRevenueCad)}`,
      `Optimistic: ${money(optimistic.cumulativeRevenueCad)}`,
      "Figures are model outputs from editable assumptions — separate from actuals.",
    ],
    speakerNotes:
      "Walk through drivers: listings × occupancy × ADR for BNHub GMV proxy; brokerage uses lead + success-fee math. Emphasize sensitivity.",
    optionalVisualSuggestion: "Side-by-side bar: three scenario totals + footnote on assumptions source.",
  };
}

export function buildTractionSlide(actualsNote?: string | null): PitchSlide {
  const useActuals = actualsNote && actualsNote.trim().length > 0;
  return {
    slideNumber: 7,
    title: "Traction / Early Proof",
    headline: useActuals ? "Observed metrics (internal)" : "Roadmap & instrumentation",
    bullets: useActuals
      ? [actualsNote!, "Verify against database exports before external sharing."]
      : [
          "Investor metrics module can export DB-backed KPIs when enabled.",
          "Until then: describe launch system + compliance posture + Montreal acquisition plan — no fabricated growth.",
        ],
    speakerNotes: "If you have audited actuals, paste a short bullet list with date range and source.",
    optionalVisualSuggestion: "Split slide: left actuals table, right near-term milestones.",
  };
}

export function buildCompetitiveSlide(): PitchSlide {
  return {
    slideNumber: 8,
    title: "Competitive Landscape",
    headline: "Why incumbents leave value on the table",
    bullets: [
      "Airbnb: guest marketplace for stays — not a Québec brokerage OS; LECIPM adds resale execution + compliance rails.",
      "Centris / portals: listing distribution — not end-to-end execution + STR operations in one stack.",
      "Broker CRMs: workflow silos — rarely unify BNHub-style hospitality payouts + deal OS with review-first AI.",
    ],
    speakerNotes: "Avoid market-share numbers unless sourced — focus on workflow + payments + trust differentiation.",
    optionalVisualSuggestion: "2×2: Hospitality vs Resale × Fragmented vs Integrated.",
  };
}

export function buildTitleSlide(): PitchSlide {
  return {
    slideNumber: 1,
    title: "Title",
    headline: `${PLATFORM_NAME} — AI operating system for Québec resale + BNHub stays`,
    bullets: ["Montreal-first · Compliance-first · Stripe-backed money movement"],
    speakerNotes: "One sentence: what you are, where you win first, how money moves safely.",
    optionalVisualSuggestion: "Full-bleed Montreal skyline + product UI chrome.",
  };
}
