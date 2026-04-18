import type { FrictionPoint, SimulationPersona } from "@/modules/simulation/user-simulation.types";

const BY_CATEGORY: Record<FrictionPoint["category"], string[]> = {
  pricing_clarity: [
    "Show total all-in price early (nights + fees + taxes) on listing cards.",
    "Add price breakdown tooltip before checkout.",
  ],
  trust_signals: [
    "Surface verification badges and review counts above the fold.",
    "Add explicit cancellation/refund summary near CTA.",
  ],
  performance: [
    "Measure LCP on listing and search routes; defer non-critical scripts.",
  ],
  listing_clarity: [
    "Standardize hero photo + key facts grid; test with 5-second comprehension task.",
  ],
  checkout: [
    "Reduce steps to Stripe; show fee line items before redirect.",
    "Add trust microcopy at payment (secure payment, what happens next).",
  ],
  hidden_fees: [
    "Disclose service fee and taxes in search results and listing header.",
  ],
  onboarding: [
    "Split host listing into progressive steps with save draft.",
    "Inline help for cadastre/pricing fields with examples.",
  ],
  guidance: [
    "Add next-step panel for broker deals (single primary CTA).",
    "Empty states with 3-step getting started.",
  ],
  workflow: [
    "Map deal stages to one visible checklist; reduce parallel modals.",
  ],
  mobile_ux: [
    "Sticky primary action on mobile; reduce horizontal scroll in action center.",
  ],
  admin_visibility: [
    "Fraud queue: SLA badge + last action; default sort by risk score.",
  ],
  errors_validation: [
    "Inline field errors with examples; preserve form state on failure.",
  ],
  navigation: [
    "Breadcrumbs on nested dashboards; one global search entry point.",
  ],
  decision_paralysis: [
    "Limit comparable listings to 3 with clear diff (price, distance, rating).",
  ],
  value_perception: [
    "Host dashboard: show revenue impact of price/occupancy changes.",
  ],
};

export function recommendationsForFriction(points: FrictionPoint[]): string[] {
  const out: string[] = [];
  const seen = new Set<string>();
  for (const p of points) {
    const lines = BY_CATEGORY[p.category] ?? ["Review " + p.category + " patterns in analytics."];
    for (const line of lines) {
      if (!seen.has(line)) {
        seen.add(line);
        out.push(line);
      }
    }
  }
  return out;
}

export function personaSpecificTips(persona: SimulationPersona): string[] {
  switch (persona) {
    case "price_sensitive_guest":
      return ["Test price-sort default and 'total stay' filter visibility."];
    case "busy_broker_mobile":
      return ["Batch approvals; max 2 taps for safe actions; defer detail to desktop."];
    case "confused_user":
      return ["Recover from wrong nav: persistent 'where am I' bar on wizard flows."];
    case "first_time_host":
      return ["Video or GIF for first listing publish path."];
    default:
      return [];
  }
}
