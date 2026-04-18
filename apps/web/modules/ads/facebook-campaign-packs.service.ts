/**
 * Ready-to-use Meta (Facebook/Instagram) campaign packs — copy + targeting guidance only.
 * No Graph API calls; operators paste into Ads Manager.
 */

export type MetaCampaignPackId = "bnhub_host" | "bnhub_guest" | "buyer_renter" | "broker";

export type FacebookCampaignPack = {
  id: MetaCampaignPackId;
  label: string;
  objective: "OUTCOME_TRAFFIC" | "OUTCOME_LEADS" | "OUTCOME_ENGAGEMENT";
  audience: {
    locations: string[];
    ageRange: [number, number];
    interests: string[];
    behaviors: string[];
    languages: string[];
  };
  primaryText: [string, string, string];
  headlines: [string, string, string];
  cta: "LEARN_MORE" | "SIGN_UP" | "BOOK_NOW" | "GET_QUOTE" | "CONTACT_US";
  visualHookSuggestions: string[];
  landingPath: string;
  utmCampaign: string;
};

const BASE_LOC = ["Montréal, QC", "Laval, QC +15km"];

export function listFacebookCampaignPacks(city = "Montréal"): FacebookCampaignPack[] {
  const c = city.trim() || "Montréal";
  const slug = c.toLowerCase().replace(/\s+/g, "-");

  const host: FacebookCampaignPack = {
    id: "bnhub_host",
    label: "BNHub — hosts",
    objective: "OUTCOME_LEADS",
    audience: {
      locations: BASE_LOC,
      ageRange: [28, 55],
      interests: ["Airbnb", "Short-term rental", "Real estate investing", "Property management", "Passive income"],
      behaviors: ["Small business owners", "Engaged shoppers"],
      languages: ["French", "English"],
    },
    primaryText: [
      `Earn more from your ${c} space — BNHub on LECIPM lists your stay with calendar control and clear guest checkout.`,
      `Hosts in ${c}: publish once, manage pricing and availability without OTA lock-in noise — real guests, structured flows.`,
      `Turn spare capacity into revenue — short-term rental demand in ${c} is measurable; start with a verified listing draft.`,
    ],
    headlines: [`Host on BNHub · ${c}`, `Short-term rental income · ${c}`, `List your stay — ${c}`],
    cta: "SIGN_UP",
    visualHookSuggestions: [
      "Before/after calendar screenshot (anonymized)",
      "Neighbourhood skyline + “from $/night” badge",
      "Host testimonial quote overlay (permission required)",
    ],
    landingPath: `/ads/host?city=${encodeURIComponent(c)}`,
    utmCampaign: `meta_host_${slug}_v1`,
  };

  const guest: FacebookCampaignPack = {
    id: "bnhub_guest",
    label: "BNHub — guests",
    objective: "OUTCOME_TRAFFIC",
    audience: {
      locations: BASE_LOC,
      ageRange: [22, 54],
      interests: ["Travel", "Vacation", "Weekend getaway", "Airbnb", c],
      behaviors: ["Frequent travellers", "Engaged shoppers"],
      languages: ["French", "English"],
    },
    primaryText: [
      `Book a stay in ${c} — browse BNHub listings with transparent nightly pricing before you commit.`,
      `Planning a trip? Compare short-term rentals in ${c} on LECIPM — real inventory, structured checkout when you book.`,
      `Find a place for your dates — guest flows built for clarity, not dark patterns.`,
    ],
    headlines: [`Stays in ${c}`, `BNHub · ${c}`, `Book a short stay`],
    cta: "BOOK_NOW",
    visualHookSuggestions: [
      "Carousel of listing photos (licensed)",
      "Map pin animation over city boroughs",
      "Price-per-night clarity screenshot",
    ],
    landingPath: `/ads/bnhub?city=${encodeURIComponent(c)}`,
    utmCampaign: `meta_guest_${slug}_v1`,
  };

  const buyer: FacebookCampaignPack = {
    id: "buyer_renter",
    label: "Buyers / renters",
    objective: "OUTCOME_LEADS",
    audience: {
      locations: BASE_LOC,
      ageRange: [25, 58],
      interests: ["First-time buyer", "Mortgage", "Real estate", "Renting", "Home improvement"],
      behaviors: ["Engaged shoppers", "Newly engaged (contextual)"],
      languages: ["French", "English"],
    },
    primaryText: [
      `Buying or renting in ${c}? Explore marketplace listings and CRM-ready lead capture when you’re ready to talk to a broker.`,
      `See what’s available in ${c} — save searches and route to a professional without spammy handoffs.`,
      `Investors & first-time buyers: structured discovery on LECIPM — attribution stays honest with UTMs.`,
    ],
    headlines: [`Homes in ${c}`, `Buy or rent · ${c}`, `Marketplace + brokers`],
    cta: "GET_QUOTE",
    visualHookSuggestions: [
      "Mortgage-vs-rent simple split graphic",
      "Neighbourhood photo + median ask (if data licensed)",
      "Checklist graphic: “3 steps before a showing”",
    ],
    landingPath: `/ads/buy?city=${encodeURIComponent(c)}`,
    utmCampaign: `meta_buyer_${slug}_v1`,
  };

  const broker: FacebookCampaignPack = {
    id: "broker",
    label: "Brokers",
    objective: "OUTCOME_LEADS",
    audience: {
      locations: BASE_LOC,
      ageRange: [26, 60],
      interests: ["Real estate broker", "Real estate", "CRM", "Sales", "OACIQ", "Real estate investment"],
      behaviors: ["Business decision makers"],
      languages: ["French", "English"],
    },
    primaryText: [
      `Brokers in ${c}: pipeline + listings + collaboration on one Québec marketplace stack — review-only automations.`,
      `Grow your book without losing attribution — LECIPM ties leads to your workspace with audit-friendly trails.`,
      `Less tool sprawl: CRM motions, deals, and marketing surfaces when your team enables modules.`,
    ],
    headlines: [`Broker workspace · ${c}`, `Pipeline for brokers`, `LECIPM Pro · ${c}`],
    cta: "LEARN_MORE",
    visualHookSuggestions: [
      "CRM pipeline screenshot (sanitized)",
      "Logo wall of partner brokerages (if approved)",
      "Short Loom-style storyboard (static frames)",
    ],
    landingPath: "/en/ca/dashboard/broker",
    utmCampaign: `meta_broker_${slug}_v1`,
  };

  return [guest, host, buyer, broker];
}
