/** Opaque browser session for experiment assignment (set in middleware). */
export const EXPERIMENT_SESSION_COOKIE_NAME = "lecipm_exp_session" as const;

/** Forwarded on the request so RSC sees the same id on first paint as middleware. */
export const EXPERIMENT_SESSION_HEADER = "x-lecipm-exp-session" as const;

/** Standard surfaces for `Experiment.targetSurface` + UI wiring. */
export const EXPERIMENT_SURFACES = {
  LECIPM_HOME_HERO: "lecipm_home_hero",
  LECIPM_HOME_SEARCH_CTA: "lecipm_home_search_cta",
  BNHUB_LISTING_CTA: "bnhub_listing_cta",
  BNHUB_LISTING_TRUST_LINE: "bnhub_listing_trust_line",
  BNHUB_BOOKING_REASSURANCE: "bnhub_booking_reassurance",
} as const;

export type ExperimentSurface = (typeof EXPERIMENT_SURFACES)[keyof typeof EXPERIMENT_SURFACES];

/** Allowed experiment analytics event names (extend as needed). */
export const EXPERIMENT_EVENT_NAMES = [
  "page_view",
  "listing_view",
  "cta_click",
  "booking_start",
  "booking_complete",
  "contact_click",
] as const;

export type ExperimentEventName = (typeof EXPERIMENT_EVENT_NAMES)[number];
