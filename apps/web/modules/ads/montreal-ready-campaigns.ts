/**
 * Google Ads–ready campaign presets (Montreal / Greater Montréal).
 * Copy is deterministic; tune match types and bids in Google Ads UI.
 */

export type MontrealCampaignPreset = {
  id: string;
  name: string;
  summary: string;
  /** App-relative path (prepend locale, e.g. `/fr/ca`). */
  landingPath: string;
  /** Suggested `utm_campaign` slug — align with Google Ads campaign name. */
  utmCampaign: string;
  /** Phrase/Exact seeds — not medical/legal claims. */
  keywords: string[];
  headlines: string[];
  descriptions: string[];
  /** Non-binding targeting hint for Ads UI (geo + language). */
  targetingSuggestion: string;
};

/** Required keyword seeds (Phase 12) — also folded into presets where relevant. */
export const MONTREAL_KEYWORD_BANK = [
  "short term rental Montreal",
  "Airbnb Montreal alternative",
  "rent apartment Montreal",
  "buy condo Montreal",
  "real estate broker Montreal",
  "investment property Montreal",
] as const;

export const MONTREAL_READY_CAMPAIGNS: readonly MontrealCampaignPreset[] = [
  {
    id: "bnhub-short-term-montreal",
    name: "BNHub — Short-term rentals (Montréal)",
    summary: "Drive hosted stays and BNHub checkout intent in Greater Montréal.",
    landingPath: "/lp/rent",
    utmCampaign: "bnhub_str_montreal_v1",
    keywords: [
      ...MONTREAL_KEYWORD_BANK.slice(0, 2),
      "Montreal vacation rental",
      "downtown Montreal stay",
      "BNHub Montreal",
    ],
    headlines: [
      "Book a Montréal stay — BNHub",
      "Short stays in Greater Montréal",
      "Secure checkout for Montreal stays",
      "Find your next Montréal stay",
      "Stays built for guests & hosts",
      "Search Montréal short-term rentals",
      "Transparent pricing before you book",
      "LECIPM — Québec stays marketplace",
      "From search to confirmed stay",
      "Montréal nights, fewer surprises",
    ],
    descriptions: [
      "Explore short-term stays in Montréal with clear pricing and structured booking flows on LECIPM BNHub.",
      "Guests search dates and listings; checkout uses Stripe where enabled — built for trust and speed.",
      "Hosts list once and manage availability in one place — built for serious operators in Québec.",
      "Compare options across Greater Montréal and book when you are ready.",
      "LECIPM BNHub: stays marketplace with operational tooling for hosts and a smooth guest path.",
    ],
    targetingSuggestion:
      "Geo: Greater Montréal + travel radius; Languages: FR + EN; Intent: accommodation / travel; Exclude jobs unrelated to stays.",
  },
  {
    id: "sell-broker-montreal",
    name: "Sell — Broker & listing intent (Montréal)",
    summary: "Capture sellers and broker-led listing conversations in Montréal.",
    landingPath: "/lp/buy",
    utmCampaign: "sell_broker_mtl_v1",
    keywords: [
      "sell condo Montreal",
      "list home Montreal",
      "real estate broker Montreal",
      "MLS Montreal listing help",
      "sell property Montreal",
    ],
    headlines: [
      "Sell smarter in Montréal",
      "Broker-led next steps — LECIPM",
      "List with clarity in Greater Montréal",
      "From valuation curiosity to a plan",
      "Serious sellers start here",
      "Compare paths before you commit",
      "Montréal real estate — structured contact",
      "Professional workflows buyers expect",
      "Less noise. More signal.",
      "LECIPM — marketplace + professionals",
    ],
    descriptions: [
      "Browse inventory where available and connect with professionals when you are ready — no forced calls.",
      "LECIPM unifies discovery and next steps for buyers and sellers in Québec.",
      "Trust indicators and platform rules where applicable — built for disciplined decisions.",
      "Move from browsing to a structured intro with brokers on your terms.",
      "Platform tooling for listings, messaging, and operational clarity across hubs.",
    ],
    targetingSuggestion:
      "Geo: Montréal CMA; Languages: FR + EN; Intent: real estate sale / broker; Layer: in-market real estate + similar audiences cautiously.",
  },
  {
    id: "rent-long-montreal",
    name: "Rent — Residential search (Montréal)",
    summary: "Align paid rent intent with marketplace discovery and BNHub stays where relevant.",
    landingPath: "/lp/rent",
    utmCampaign: "rent_mtl_v1",
    keywords: [
      "rent apartment Montreal",
      "Montreal apartment for rent",
      "Plateau Mont-Royal rental",
      "downtown Montreal rent",
    ],
    headlines: [
      "Rent discovery — start on LECIPM",
      "Montréal rentals: search with clarity",
      "Find what fits — then move fast",
      "Structured search. Clear next steps.",
      "Explore Montréal homes & stays",
      "From filters to contact — one flow",
      "Less scrolling. More relevance.",
      "Greater Montréal — one hub",
      "Rent path built for busy people",
      "LECIPM — Québec marketplace",
    ],
    descriptions: [
      "Search listings and short stays depending on your goal — unified discovery on LECIPM.",
      "Save what fits and return when you are ready; platform rules keep expectations clear.",
      "For BNHub stays, see pricing and availability signals before you commit.",
      "Built for renters who want signal, not spam.",
      "Connect with listings and tools aligned to Québec operations.",
    ],
    targetingSuggestion:
      "Geo: Montréal + inner suburbs; Languages: FR + EN; Split BNHub stay terms vs long-term rent in separate ad groups.",
  },
  {
    id: "invest-montreal",
    name: "Invest — Opportunities & analysis (Montréal)",
    summary: "Investor funnel into analyzer and investment surfaces with Montréal context.",
    landingPath: "/lp/invest",
    utmCampaign: "invest_mtl_v1",
    keywords: [
      "investment property Montreal",
      "Montreal cap rate analysis",
      "real estate investment Quebec",
      "duplex Montreal investment",
    ],
    headlines: [
      "Underwrite Montréal deals with discipline",
      "Investment analysis — LECIPM",
      "Stress assumptions before you wire capital",
      "Scenario tools for serious investors",
      "Model returns with clarity",
      "Compare deals side-by-side",
      "From thesis to checklist — faster",
      "Québec-focused investment workspace",
      "Data-first decisions in Montréal",
      "LECIPM — investor tooling",
    ],
    descriptions: [
      "Run scenarios and compare opportunities — built for repeat investors and advisors.",
      "Keep diligence consistent: assumptions, sensitivity, and next steps in one workspace.",
      "Aligned with disclosure and eligibility rules — not financial advice.",
      "Turn curiosity into a repeatable underwriting workflow.",
      "Portfolio thinking with practical tools — fewer spreadsheet traps.",
    ],
    targetingSuggestion:
      "Geo: Montréal + investor-heavy suburbs; Languages: FR + EN; Intent: investment / finance; Exclude regulated claims; use portfolio exclusions for low intent.",
  },
];
