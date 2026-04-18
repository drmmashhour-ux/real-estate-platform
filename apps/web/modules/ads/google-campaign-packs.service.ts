/**
 * Google Ads Search — structured campaign packs (human setup). No Google Ads API calls.
 */

export type GoogleCampaignGroupId =
  | "short_term_rental_income"
  | "rent_apartment_montreal"
  | "buy_property_montreal"
  | "investment_property_montreal";

export type KeywordCluster = {
  phrase: string[];
  exact: string[];
};

export type GoogleAdsCampaignPack = {
  id: GoogleCampaignGroupId;
  campaignName: string;
  adGroups: { name: string; keywords: KeywordCluster }[];
  negativeKeywords: string[];
  headlines: [string, string, string, string, string, string, string, string, string, string, string, string, string, string, string];
  descriptions: [string, string, string, string];
  landingPath: string;
  utmCampaign: string;
};

function headlines15(base: string[]): [string, string, string, string, string, string, string, string, string, string, string, string, string, string, string] {
  const padded = [...base];
  while (padded.length < 15) padded.push(`${base[0]} · LECIPM`);
  return padded.slice(0, 15) as GoogleAdsCampaignPack["headlines"];
}

export function listGoogleCampaignPacks(city = "Montréal"): GoogleAdsCampaignPack[] {
  const c = city.trim() || "Montréal";
  const slug = c.toLowerCase().replace(/\s+/g, "-");

  const str: GoogleAdsCampaignPack = {
    id: "short_term_rental_income",
    campaignName: `LECIPM_STR_Income_${slug}_v1`,
    adGroups: [
      {
        name: `STR_Income_Core`,
        keywords: {
          phrase: [
            "short term rental income",
            "airbnb income montreal",
            "short term rental montreal",
          ],
          exact: ["str income", "bnb revenue"],
        },
      },
      {
        name: `STR_Income_Side`,
        keywords: {
          phrase: ["rent spare room montreal", "furnished rental income"],
          exact: ["short term lease income"],
        },
      },
    ],
    negativeKeywords: ["free", "job", "course", "pdf", "illegal"],
    headlines: headlines15([
      `BNHub STR · ${c}`,
      "Short-Term Rental Income",
      "List Your Stay — LECIPM",
      "Transparent Guest Checkout",
      "Hosts: Calendar Control",
      "Real Listings · Québec",
      "Start Hosting Today",
      "Nightly Pricing You Set",
      "No Auto Ad Spend Here",
      "Verified Listing Flow",
      "Reach Travellers",
      "LECIPM Marketplace",
      "Host Tools Included",
      "Guest-Ready Booking Path",
      "Grow STR Revenue",
    ]),
    descriptions: [
      "Host short-term stays on LECIPM BNHub — structured listing wizard and checkout rails.",
      "Operators set ad budgets off-platform; track leads with UTMs and growth dashboard.",
      "Compare performance using real CRM + funnel events — no fabricated ROI.",
      "Start paused in Google Ads; launch when creative + landing QA pass.",
    ],
    landingPath: `/ads/host?city=${encodeURIComponent(c)}`,
    utmCampaign: `google_str_income_${slug}_v1`,
  };

  const rent: GoogleAdsCampaignPack = {
    id: "rent_apartment_montreal",
    campaignName: `LECIPM_Rent_Apt_${slug}_v1`,
    adGroups: [
      {
        name: `Rent_Phrase`,
        keywords: {
          phrase: ["rent apartment montreal", "apartment for rent montreal", "lease montreal"],
          exact: ["rent apt montreal", "2 bedroom rent montreal"],
        },
      },
      {
        name: `Rent_Neighbourhoods`,
        keywords: {
          phrase: ["plateau rent apartment", "ndg apartment rent", "laval rent apartment"],
          exact: ["rent plateau montreal"],
        },
      },
    ],
    negativeKeywords: ["free", "cheap flights", "jobs", "roommate wanted scam"],
    headlines: headlines15([
      `Rent in ${c}`,
      "Apartments · LECIPM",
      "Browse Rentals",
      "Marketplace Listings",
      "Save Searches",
      "Broker-Ready Leads",
      "Law 25 Friendly Consent",
      "Transparent Attribution",
      "Find Your Next Lease",
      "Listings Updated Regularly",
      "Compare Homes Easily",
      "Guest & Resale Paths",
      "Start Your Search",
      "LECIPM Québec",
      "Rent Smarter",
    ]),
    descriptions: [
      "Search rental listings in Montréal & surroundings — attribution via UTMs when you engage brokers.",
      "LECIPM does not guarantee availability; listings reflect marketplace data.",
      "Lead capture optional on landings; review CRM before outreach.",
      "Add exact-match controls once search terms show intent.",
    ],
    landingPath: `/ads/buy?city=${encodeURIComponent(c)}`,
    utmCampaign: `google_rent_${slug}_v1`,
  };

  const buy: GoogleAdsCampaignPack = {
    id: "buy_property_montreal",
    campaignName: `LECIPM_Buy_${slug}_v1`,
    adGroups: [
      {
        name: `Buy_Intent`,
        keywords: {
          phrase: ["buy property montreal", "condo for sale montreal", "house for sale montreal"],
          exact: ["buy home montreal", "first time buyer montreal"],
        },
      },
      {
        name: `Buy_Mortgage`,
        keywords: {
          phrase: ["mortgage pre approval montreal", "buy condo montreal downtown"],
          exact: ["duplex sale montreal"],
        },
      },
    ],
    negativeKeywords: ["rent to own scam", "free valuation spam", "jobs"],
    headlines: headlines15([
      `Buy in ${c}`,
      "Homes & Condos",
      "Marketplace + CRM",
      "Broker Introductions",
      "Serious Buyers Welcome",
      "Save Listings",
      "Mortgage-Ready Journey",
      "Transparent Fees",
      "FSBO Where Enabled",
      "LECIPM Listings",
      "Book a Callback",
      "Investors & Owners",
      "Neighbourhood Search",
      "Offer-Ready Tools",
      "Move With Confidence",
    ]),
    descriptions: [
      "Explore resale paths on LECIPM — connect with professionals when you choose.",
      "No automated bidding on listings; compliance with brokerage advertising rules is your responsibility.",
      "Track funnel events in Marketing Intelligence when enabled.",
      "Tighten negatives weekly from search terms reports.",
    ],
    landingPath: `/ads/buy?city=${encodeURIComponent(c)}`,
    utmCampaign: `google_buy_${slug}_v1`,
  };

  const inv: GoogleAdsCampaignPack = {
    id: "investment_property_montreal",
    campaignName: `LECIPM_Invest_${slug}_v1`,
    adGroups: [
      {
        name: `Invest_STR`,
        keywords: {
          phrase: ["investment property montreal", "duplex investment montreal", "short term rental investment"],
          exact: ["cashflow property montreal"],
        },
      },
      {
        name: `Invest_Long`,
        keywords: {
          phrase: ["multi family building montreal", "income property laval"],
          exact: ["plex investment montreal"],
        },
      },
    ],
    negativeKeywords: ["crypto", "forex", "get rich quick", "mlm"],
    headlines: headlines15([
      "Income Property Search",
      `Invest · ${c}`,
      "Multi-Family Listings",
      "Cashflow-Focused Filters",
      "STR + Resale Signals",
      "LECIPM Investors",
      "Broker Collaboration",
      "Due Diligence First",
      "No Hype — Real Data",
      "Portfolio Review",
      "Risk-Aware Journey",
      "Save & Share Deals",
      "Mortgage + Listings",
      "Québec Marketplace",
      "Build Your Thesis",
    ]),
    descriptions: [
      "Investment discovery on LECIPM — not financial advice; coordinate with licensed pros.",
      "Use negative keywords to block speculative scams; monitor CPL carefully.",
      "Prefer phrase + exact until conversion volume supports broad match.",
      "Pair with `/dashboard/growth` to validate lead quality before scaling.",
    ],
    landingPath: `/ads/buy?city=${encodeURIComponent(c)}`,
    utmCampaign: `google_invest_${slug}_v1`,
  };

  return [str, rent, buy, inv];
}
