/**
 * Ready-made copy for Meta / Google remarketing — paste into Ads Manager.
 * Audiences: see `docs/growth/retargeting-playbook.md` and `meta-retargeting.md`.
 */

export type RetargetingAdBundleId = "browse_no_purchase" | "listing_viewed" | "checkout_abandon";

export type RetargetingAdBundle = {
  id: RetargetingAdBundleId;
  /** Meta custom audience rule hint (Events Manager) */
  audienceHint: string;
  headlines: string[];
  bodyLines: string[];
  cta: string;
  placementsNote: string;
};

/** Broad: site traffic without Purchase (exclude Purchase 90–180d). */
export const RETARGETING_AD_BROWSE_NO_PURCHASE: RetargetingAdBundle = {
  id: "browse_no_purchase",
  audienceHint: "Include: PageView 90–180d · Exclude: Purchase (same or longer window)",
  headlines: ["Still planning your stay?", "Find your dates on LECIPM"],
  bodyLines: [
    "Verified stays where shown · Secure booking · See nightly rates before you commit.",
    "Browse BNHUB short-term rentals — pick dates first; you review the total before paying.",
  ],
  cta: "Find your dates",
  placementsNote: "Feed + Stories; 1:1 or 4:5 creative",
};

/** Warm: viewed a listing (ViewContent) but no paid booking. */
export const RETARGETING_AD_LISTING_VIEWED: RetargetingAdBundle = {
  id: "listing_viewed",
  audienceHint: "Include: ViewContent 30–90d · Exclude: Purchase",
  headlines: ["The stay you opened is still available", "Pick up where you left off in {city}"],
  bodyLines: [
    "Secure checkout with Stripe where enabled · You won’t be charged until you confirm.",
    "Reserve now — review nights, fees, and total before any payment.",
  ],
  cta: "Reserve now",
  placementsNote: "Carousel with listing photos when you have the listing URL in the ad",
};

/** Hot: AddToCart or InitiateCheckout, no Purchase. */
export const RETARGETING_AD_CHECKOUT_ABANDON: RetargetingAdBundle = {
  id: "checkout_abandon",
  audienceHint: "Include: InitiateCheckout (or AddToCart) 14–30d · Exclude: Purchase",
  headlines: ["Finish your reservation", "Your dates are waiting"],
  bodyLines: [
    "Complete booking on LECIPM — secure checkout when Stripe is available for this stay.",
    "One step away from confirming your stay.",
  ],
  cta: "Complete booking",
  placementsNote: "Dynamic creative with urgency; optimize for InitiateCheckout or Purchase depending on volume",
};

export const RETARGETING_AD_BUNDLES: RetargetingAdBundle[] = [
  RETARGETING_AD_BROWSE_NO_PURCHASE,
  RETARGETING_AD_LISTING_VIEWED,
  RETARGETING_AD_CHECKOUT_ABANDON,
];
