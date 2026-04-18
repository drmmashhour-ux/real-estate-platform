/**
 * Landing page optimization hints — pairs with funnel events (landing_view, lead_capture, etc.).
 * Does not modify live pages; returns explainable recommendations only.
 */

export type LandingOptimizerResult = {
  ctaPlacement: string[];
  trustSignals: string[];
  frictionReduction: string[];
  /** Fire via `/api/marketing-intelligence/v1/soft-launch/event` or marketing-system v2 events */
  suggestedEventsToTrack: { step: string; note: string }[];
};

export function optimizeLandingExperience(input: { city: string; audience: string }): LandingOptimizerResult {
  const city = input.city.trim() || "Montréal";
  return {
    ctaPlacement: [
      "Primary CTA sticky on mobile after hero scroll (one action: browse or lead form).",
      "Repeat CTA after social proof strip — same label as hero for consistency.",
    ],
    trustSignals: [
      "Show broker / BNHub badges without exposing internal fraud scores.",
      `Local context line: “Listings and stays in ${city} — verify details before visit.”`,
    ],
    frictionReduction: [
      "Lead form: name + email only on first step; phone optional.",
      "Pre-select intent (buy / rent / host) to route CRM without extra clicks.",
    ],
    suggestedEventsToTrack: [
      { step: "landing_view", note: "Once per session/day via soft-launch beacon (idempotent)." },
      {
        step: "lead_capture",
        note: "Emitted on lead capture — authenticated Growth Machine POST, or public branch with publicAcquisition + MI.",
      },
      { step: "listing_view", note: "Listing detail beacon — ties ad traffic to property engagement." },
    ],
  };
}
