/**
 * Live investor pitch beats — “Apple-level” narrative flow (read in order).
 */
export const pitchScript = [
  {
    title: "Problem",
    text: "Real estate platforms today are static. Listings are poorly optimized, pricing is outdated, and compliance is manual and risky.",
  },
  {
    title: "Solution",
    text: "LECIPM is a self-optimizing real estate marketplace that uses AI to manage pricing, trust, compliance, and growth automatically.",
  },
  {
    title: "Product",
    text: "We combine listings, short-term rentals, broker tools, and compliance into one intelligent platform.",
  },
  {
    title: "Technology",
    text: "Our system uses autonomous agents, event-driven architecture, and data intelligence to continuously improve marketplace performance.",
  },
  {
    title: "Advantage",
    text: "Unlike competitors, we don’t just host listings—we optimize them automatically.",
  },
  {
    title: "Vision",
    text: "We are building the future of real estate marketplaces: autonomous, compliant, and revenue-optimized.",
  },
] as const;

export type PitchScriptBeat = (typeof pitchScript)[number];
export type PitchScript = typeof pitchScript;
