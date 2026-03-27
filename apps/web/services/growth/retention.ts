/**
 * Retention copy + lifecycle helpers — pair with email/push when wired.
 * See docs/10k-scaling-system.md (retention strategy).
 */

export type RetentionKind =
  | "dormant_guest_7d"
  | "dormant_guest_30d"
  | "dormant_host_14d"
  | "incomplete_listing"
  | "post_stay_review"
  | "wishlist_reminder";

const TEMPLATES: Record<RetentionKind, (name?: string, place?: string) => { subject: string; body: string }> = {
  dormant_guest_7d: (name) => ({
    subject: "Still looking for a stay?",
    body: `Hi${name ? ` ${name}` : ""} — new verified listings dropped this week. Pick dates and we’ll highlight best value in your area.`,
  }),
  dormant_guest_30d: (name) => ({
    subject: "We saved your search ideas",
    body: `Hi${name ? ` ${name}` : ""} — here are 3 stays that match what you browsed. Reply with your dates if you want a human to shortlist.`,
  }),
  dormant_host_14d: (name) => ({
    subject: "Finish your listing — we’ll promote early hosts",
    body: `Hi${name ? ` ${name}` : ""} — your draft is almost live. Complete photos + pricing and we’ll feature you in the next local push.`,
  }),
  incomplete_listing: () => ({
    subject: "One step to go live",
    body: "Open your dashboard — calendar and pricing are usually the fastest path to your first booking.",
  }),
  post_stay_review: (_, place) => ({
    subject: "How was your stay?",
    body: `Thanks for booking${place ? ` at ${place}` : ""}. A 30-second review helps the next guest and boosts great hosts.`,
  }),
  wishlist_reminder: (name, place) => ({
    subject: place ? `${place} is still available` : "A saved stay is waiting",
    body: `Hi${name ? ` ${name}` : ""} — dates fill fast on popular weekends. Lock yours before it’s gone.`,
  }),
};

export function reengagementMessage(kind: RetentionKind, name?: string, place?: string) {
  return TEMPLATES[kind](name, place);
}

/** Suggested in-app tips for first session (guest). */
export const GUEST_ONBOARDING_TIPS: string[] = [
    "Add dates and guest count first — prices update with availability.",
    "Filter by verified listings when you want extra assurance.",
    "Save a listing before you leave — we can remind you before dates sell out.",
  ];

/** Product recommendations stub — replace with real personalization service. */
export function placeholderRecommendations(_userId: string, city?: string): string[] {
  return [
    city ? `Trending this week in ${city}` : "Trending stays this week",
    "Stays with flexible cancellation",
    "Entire homes under median price",
  ];
}
