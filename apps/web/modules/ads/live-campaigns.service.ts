/**
 * LECIPM live paid ads — copy, targeting, and budget rules for human setup in Meta/Google UIs.
 * No API calls; no auto-spend.
 */

export type LiveCampaignId = "bnhub_hosts" | "guests_renters" | "buyers_investors";

export type LiveTargeting = {
  locations: string[];
  ageMin: number;
  ageMax: number;
  interests: string[];
};

export type LiveCreative = {
  primaryTexts: [string, string, string];
  headlines: string[];
  ctaLabel: string;
};

export type LiveCampaignDefinition = {
  id: LiveCampaignId;
  name: string;
  channel: "meta" | "google_search";
  targeting: LiveTargeting;
  creative: LiveCreative;
  /** Path after locale/country, e.g. /ads/host or /ads/bnhub/stays */
  landingPath: string;
  /** Where primary CTA on that LP routes (for ops clarity) */
  primaryDestinationNote: string;
  utmCampaign: string;
};

export type InitialBudgetPlan = {
  day1to5: string;
  day6to10: string;
  day10plus: string;
};

export type SpendRules = {
  kill: string[];
  scale: string[];
};

/**
 * Three primary campaigns — production copy (not lorem ipsum).
 * Host acquisition → `/ads/host`. Guest discovery → `/ads/bnhub/stays` (alias → `/ads/bnhub`). Buyers → `/ads/buy`.
 */
export function getLiveCampaignDefinitions(): LiveCampaignDefinition[] {
  return [
    {
      id: "bnhub_hosts",
      name: "BNHub — Hosts (main acquisition)",
      channel: "meta",
      targeting: {
        locations: ["Montréal, QC", "Laval, QC + radius"],
        ageMin: 25,
        ageMax: 55,
        interests: ["Airbnb", "Real estate investing", "Rental income", "Passive income"],
      },
      creative: {
        primaryTexts: [
          "Turn your property into daily income.\nList it in minutes. Let AI handle the rest.",
          "Your apartment could be making money every night.\nMost people don’t know how — we made it simple.",
          "Stop leaving money on the table.\nYour property = income. Start today.",
        ],
        headlines: ["Start earning with your property", "Turn your apartment into income", "Monetize your property today"],
        ctaLabel: "Get Started",
      },
      landingPath: "/ads/host",
      primaryDestinationNote: "LP primary CTA → host listing wizard (`/bnhub/host/listings/new` or locale equivalent).",
      utmCampaign: "lecipm_live_hosts_v1",
    },
    {
      id: "guests_renters",
      name: "BNHub — Guests / renters",
      channel: "meta",
      targeting: {
        locations: ["Montréal, QC"],
        ageMin: 18,
        ageMax: 40,
        interests: ["Travel", "Airbnb", "Apartments", "Short-term rentals"],
      },
      creative: {
        primaryTexts: [
          "Find better stays. Better prices.\nPowered by AI — discover places others miss.",
          "Compare BNHub stays with clear nightly pricing before you book — less noise, more signal.",
          "Weekend or week-long — search Montréal stays on LECIPM and move when you’re ready.",
        ],
        headlines: ["Find your next stay faster"],
        ctaLabel: "Explore",
      },
      landingPath: "/ads/bnhub/stays",
      primaryDestinationNote: "Alias to `/ads/bnhub`; LP primary CTA → BNHub stays search (`/bnhub/stays`).",
      utmCampaign: "lecipm_live_guests_v1",
    },
    {
      id: "buyers_investors",
      name: "Buyers / investors",
      channel: "meta",
      targeting: {
        locations: ["Montréal, QC"],
        ageMin: 25,
        ageMax: 60,
        interests: ["Buying property", "Mortgage", "Investment", "Real estate"],
      },
      creative: {
        primaryTexts: [
          "Find investment properties faster.\nAnalyze deals instantly with AI.",
          "Browse Montréal resale + investment angles in one stack — CRM-ready when you raise your hand.",
          "Serious about your next deal? Save listings and route to a licensed pro when you choose.",
        ],
        headlines: ["Discover smarter investments"],
        ctaLabel: "View Listings",
      },
      landingPath: "/ads/buy",
      primaryDestinationNote: "LP → marketplace / listings browse.",
      utmCampaign: "lecipm_live_buyers_v1",
    },
  ];
}

export function getInitialBudgetPlan(): InitialBudgetPlan {
  return {
    day1to5: "$20/day",
    day6to10: "$50/day",
    day10plus: "$100–300/day",
  };
}

export function getLiveSpendRules(): SpendRules {
  return {
    kill: ["CTR < 1% sustained over meaningful impressions", "No leads after ~$20 spend on a single ad set (confirm tracking first)"],
    scale: ["CTR > 2% with stable CPC", "Leads converting in CRM / downstream funnel"],
  };
}

/**
 * What fires on ads landings today — do not change API without product sign-off.
 * `booking_created` / payment success use authenticated or server pipelines — not public `publicAdsLanding` beacon.
 */
export const LIVE_ADS_TRACKING_CONFIRMATION = {
  endpoint: "POST /api/marketing-system/v2/events",
  publicFunnelSteps: ["landing_view", "cta_click", "listing_view", "lead_submit"] as const,
  requires: [
    "FEATURE_MARKETING_INTELLIGENCE_V1",
    "FEATURE_LANDING_PAGES_V1",
    "kind: funnel",
    "publicAdsLanding: true",
    "idempotencyKey on each request",
    "meta.source forced server-side to ads_landing_beacon for public funnel rows",
  ],
  notOnPublicBeacon: [
    "booking_created — use authenticated funnel or booking pipeline events",
    "payment_success — recorded as launch_events / performance elsewhere (see Marketing Intelligence + launch_events)",
  ],
} as const;
