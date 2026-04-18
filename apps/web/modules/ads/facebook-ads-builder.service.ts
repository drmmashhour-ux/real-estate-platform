/**
 * Meta (Facebook/Instagram) Ads — structural setup only. No API calls or auto-spend.
 */

export type FacebookCampaignType = "BNHUB_GUEST" | "HOST" | "BUYER";

export type FacebookAdsSetupInput = {
  campaignType: FacebookCampaignType;
  city: string;
  /** Daily budget in account currency — planning only */
  budgetUsd?: number;
};

export type FacebookAdsSetup = {
  campaignObjective: "Traffic" | "Leads";
  adSet: {
    location: string;
    ageRange: string;
    interests: string[];
    behaviors: string[];
  };
  creatives: {
    primaryText: string;
    headline: string;
    description: string;
    cta: "LEARN_MORE" | "SIGN_UP" | "BOOK_NOW" | "GET_QUOTE";
  }[];
  setupSteps: string[];
};

export function generateFacebookAdsSetup(input: FacebookAdsSetupInput): FacebookAdsSetup {
  const city = input.city.trim() || "Montréal";
  const budget = input.budgetUsd ?? 25;

  const baseAdSet = {
    location: `${city} +25km (adjust in Ads Manager)`,
    ageRange: "25–54 (tune per persona)",
    interests:
      input.campaignType === "HOST"
        ? ["Airbnb", "Short-term rental", "Real estate investing", "Travel hosting"]
        : input.campaignType === "BUYER"
          ? ["First-time buyer", "Zillow", "Real estate", "Mortgage"]
          : ["Travel", "Vacation rentals", "Weekend trips", city],
    behaviors: ["Engaged shoppers", "Frequent travellers", "Small business owners"],
  };

  const creatives =
    input.campaignType === "BNHUB_GUEST"
      ? [
          {
            primaryText: `Stays in ${city} on LECIPM — browse BNHub listings with clear pricing. Tap to see what’s available this week.`,
            headline: `Book a stay in ${city}`,
            description: "Verified host listings · transparent fees at checkout",
            cta: "BOOK_NOW" as const,
          },
          {
            primaryText: `Planning a trip to ${city}? Compare BNHub stays side by side — no fake scarcity, just real inventory.`,
            headline: `Compare stays · ${city}`,
            description: "Short-term rentals · guest-protected flows",
            cta: "LEARN_MORE" as const,
          },
        ]
      : input.campaignType === "HOST"
        ? [
            {
              primaryText: `List your space in ${city} on BNHub — calendar, pricing, and guest messaging in one stack.`,
              headline: `Host in ${city}`,
              description: "Reach travellers already searching LECIPM",
              cta: "SIGN_UP" as const,
            },
          ]
        : [
            {
              primaryText: `Buying or renting in ${city}? LECIPM connects listings, brokers, and your saved searches.`,
              headline: `Homes in ${city}`,
              description: "Marketplace + CRM-ready leads when you’re ready",
              cta: "GET_QUOTE" as const,
            },
          ];

  const objective: "Traffic" | "Leads" = input.campaignType === "BUYER" ? "Leads" : "Traffic";

  const setupSteps = [
    "Open Meta Ads Manager (business.facebook.com) and pick the correct ad account.",
    `Create Campaign → choose objective: **${objective}** (Traffic for BNHub guest/host exploration; Leads for buyer capture).`,
    "Name campaign: `LECIPM_{type}_{city}_v1` — set lifetime/daily cap externally (planning budget noted below).",
    `Ad set: location = ${baseAdSet.location}; age ${baseAdSet.ageRange}; placements = Advantage+ placements or manual Feed/Stories for testing.`,
    "Paste UTM on destination URL: `utm_source=facebook&utm_medium=paid&utm_campaign=lecipm_{type}_{city}_v1`.",
    `Use the primary text + headline from API export; CTA button = ${creatives[0]?.cta ?? "LEARN_MORE"}.`,
    "Pixel / CAPI: attach your dataset if already configured — LECIPM does not store Meta tokens.",
    `Review budget: ~$${budget}/day suggested test band — **you** set the cap in Meta; no auto-spend from LECIPM.`,
    "Publish as paused → QA preview links → enable when ready.",
  ];

  return {
    campaignObjective: objective,
    adSet: baseAdSet,
    creatives,
    setupSteps,
  };
}

export type HighConversionCampaignInput = {
  objective: "leads" | "conversion";
  audience: {
    location: string;
    interests: string[];
  };
};

/** Structured high-intent copy + Meta-friendly payload (planning only — no API spend). */
export type HighConversionCampaignBundle = {
  objective: "leads" | "conversion";
  location: string;
  interests: string[];
  hook: string;
  painCopy: string;
  primaryTextVariants: [string, string, string];
  headlines: [string, string, string];
  cta: "LEARN_MORE" | "SIGN_UP" | "BOOK_NOW" | "GET_QUOTE";
  adsManagerPayload: {
    objective: "OUTCOME_LEADS" | "OUTCOME_SALES";
    /** Meta Ads Manager special ad category flags — empty = none; set per account policy. */
    special_ad_categories: string[];
    ad_set: {
      targeting_geo_locations: { name: string; radius_km: number };
      interests: string[];
    };
    creatives: {
      bodies: string[];
      titles: string[];
      call_to_action_type: string;
    };
  };
};

export function buildHighConversionCampaign(input: HighConversionCampaignInput): HighConversionCampaignBundle {
  const loc = input.audience.location.trim() || "Montréal";
  const interests = input.audience.interests.length
    ? input.audience.interests
    : ["real estate", "airbnb", "investment"];
  const hook =
    input.objective === "leads"
      ? "Stop paying hidden fees on short stays — see totals before you commit."
      : "Book BNHub stays with checkout that shows pricing upfront — fewer surprises at pay.";
  const painCopy =
    "Travellers bounce when totals change at checkout. LECIPM BNHub keeps pricing readable and host tools in one place — you stay in control; we don’t auto-spend your ad budget.";

  const p1 = `${hook} Browse ${loc} stays on LECIPM — compare BNHub listings with clear nightly + fee lines.`;
  const p2 = `Investors & guests in ${loc}: short-term inventory with structured host payouts (manual or Connect). Tap to explore — no fake scarcity.`;
  const p3 = `Hosting near ${loc}? List on BNHub — calendar, messaging, and guest checkout with Stripe where enabled.`;

  const h1 = `Stays in ${loc} — totals first`;
  const h2 = `BNHub: clear pricing in ${loc}`;
  const h3 = `Hosts & guests · ${loc}`;

  const cta: HighConversionCampaignBundle["cta"] =
    input.objective === "leads" ? "SIGN_UP" : "BOOK_NOW";

  const metaObjective = input.objective === "leads" ? "OUTCOME_LEADS" : "OUTCOME_SALES";

  return {
    objective: input.objective,
    location: loc,
    interests,
    hook,
    painCopy,
    primaryTextVariants: [p1, p2, p3],
    headlines: [h1, h2, h3],
    cta,
    adsManagerPayload: {
      objective: metaObjective,
      special_ad_categories: [],
      ad_set: {
        targeting_geo_locations: { name: loc, radius_km: 25 },
        interests,
      },
      creatives: {
        bodies: [p1, p2, p3],
        titles: [h1, h2, h3],
        call_to_action_type: cta,
      },
    },
  };
}
