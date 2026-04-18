/**
 * Google Ads Search campaign structure — export for human setup in Google Ads UI.
 */
import { generateAdsCopyBundle, type AdsAudience } from "./ads-copy-generator.service";
import { generateGoogleKeywordCategories, type KeywordRow } from "./google-keywords.service";

export type GoogleAdsCampaignType = "BNHUB_GUEST" | "HOST" | "BUYER";

export type GoogleAdsCampaignBundle = {
  campaigns: {
    name: string;
    adGroups: {
      name: string;
      keywords: KeywordRow[];
      ads: { headlines: string[]; descriptions: string[] }[];
    }[];
  }[];
  negativeKeywords: string[];
  notes: string[];
};

function audienceForType(t: GoogleAdsCampaignType): AdsAudience {
  if (t === "HOST") return "host";
  if (t === "BUYER") return "buyer";
  return "buyer";
}

export function generateGoogleAdsCampaign(input: { city: string; campaignType: GoogleAdsCampaignType }): GoogleAdsCampaignBundle {
  const city = input.city.trim() || "Montréal";
  const kw = generateGoogleKeywordCategories(city);
  const copy = generateAdsCopyBundle({ city, audience: audienceForType(input.campaignType) });

  const slug = city.toLowerCase().replace(/\s+/g, "-");
  const name = `LECIPM_Search_${input.campaignType}_${slug}_v1`;

  const allKw = [...kw.transactional, ...kw.intent, ...kw.hosting];
  const adGroups =
    input.campaignType === "HOST"
      ? [
          {
            name: `Host_${slug}`,
            keywords: kw.hosting,
            ads: [
              {
                headlines: copy.google.headlines.slice(0, 3),
                descriptions: copy.google.descriptions,
              },
            ],
          },
        ]
      : input.campaignType === "BUYER"
        ? [
            {
              name: `Buyer_${slug}`,
              keywords: [...kw.transactional.slice(0, 2), ...kw.intent.slice(0, 2)],
              ads: [
                {
                  headlines: copy.google.headlines.slice(0, 3),
                  descriptions: copy.google.descriptions,
                },
              ],
            },
          ]
        : [
            {
              name: `BNHub_Guest_${slug}`,
              keywords: [...kw.transactional, ...kw.intent],
              ads: [
                {
                  headlines: copy.google.headlines.slice(0, 3),
                  descriptions: copy.google.descriptions,
                },
              ],
            },
          ];

  return {
    campaigns: [{ name, adGroups }],
    negativeKeywords: ["free", "cheap flights", "jobs", "careers"],
    notes: [
      "Create in Google Ads UI — LECIPM does not push campaigns via API.",
      "Use landing URL with UTM: utm_source=google&utm_medium=cpc&utm_campaign=" + encodeURIComponent(name),
      "Start with phrase/exact on brand + city; broaden only with conversion data.",
    ],
  };
}

const MTL_INTENTS = [
  { id: "rent_apartment", label: "Rent apartment Montréal", seed: "rent apartment montreal" },
  { id: "airbnb_investment", label: "Airbnb investment Montréal", seed: "airbnb investment montreal" },
  { id: "buy_property", label: "Buy property Montréal", seed: "buy property montreal" },
] as const;

export type IntentGoogleAdsStructure = {
  campaigns: {
    name: string;
    intentId: string;
    adGroups: { name: string; keywords: KeywordRow[] }[];
  }[];
  /** Shared RSA pool — paste into each campaign’s responsive search ads. */
  headlines: string[];
  descriptions: string[];
  notes: string[];
};

/**
 * Three intent campaigns (one each), three ad groups per campaign, phrase + exact only.
 * Export-only — no Google Ads API calls.
 */
export function buildMontrealIntentGoogleAdsStructure(): IntentGoogleAdsStructure {
  const headlines = [
    "BNHub Stays in Montréal",
    "Book Short-Term Rentals",
    "Transparent Fees at Checkout",
    "LECIPM — Québec Marketplace",
    "Compare Stays Side by Side",
    "Real Listings · Real Hosts",
    "Weekend Trip to Montréal?",
    "Investors: STR Inventory",
    "Host Tools + Guest Checkout",
    "No Surprise Totals",
    "Browse BNHub Listings",
    "Manual or Stripe Payouts",
    "Find a Rental in Montréal",
    "Airbnb-Style Stays — LECIPM",
    "Start Your Search Today",
  ];

  const descriptions = [
    "Browse BNHub on LECIPM — see pricing lines before you pay. Guests and hosts stay in control.",
    "Short-term rentals in Greater Montréal with structured checkout when Stripe is enabled.",
    "Marketplace + stays: compare listings, message hosts, and track your trip in one flow.",
    "LECIPM does not auto-spend your ad budget — export this structure into Google Ads UI manually.",
  ];

  const campaigns = MTL_INTENTS.map((intent) => {
    const base = intent.seed;
    const ag1 = `${intent.id}_core`;
    const ag2 = `${intent.id}_near`;
    const ag3 = `${intent.id}_brand`;

    const pair = (phrase: string, exact: string): KeywordRow[] => [
      { keyword: phrase, matchType: "PHRASE", intent: "transactional" },
      { keyword: exact, matchType: "EXACT", intent: "transactional" },
    ];

    const adGroups = [
      {
        name: `${intent.label} — Core`,
        keywords: pair(base, base),
      },
      {
        name: `${intent.label} — Neighbourhood`,
        keywords: pair(`${base} plateau`, `${base} plateau`),
      },
      {
        name: `${intent.label} — BNHub tail`,
        keywords: pair(`bnhub montreal ${intent.id.replace(/_/g, " ")}`, "bnhub montreal"),
      },
    ];

    return {
      name: `LECIPM_Search_${intent.id}_v1`,
      intentId: intent.id,
      adGroups,
    };
  });

  return {
    campaigns,
    headlines,
    descriptions,
    notes: [
      "One campaign per intent; each has 3 ad groups (core / neighbourhood / brand+B).",
      "Keywords use PHRASE + EXACT pairs — adjust match syntax to Google Ads editor format.",
      "15 headlines + 4 descriptions are shared RSA assets — duplicate per ad group if needed.",
    ],
  };
}
