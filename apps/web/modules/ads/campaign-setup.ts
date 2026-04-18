/**
 * Google Ads–ready structure for the $100 micro-flight (Montréal).
 * Copy is deterministic; import into Ads Editor / UI — not an API push.
 */

import { MONTREAL_KEYWORD_BANK } from "./montreal-ready-campaigns";

export type AdGroupSpec = {
  id: string;
  name: string;
  keywords: string[];
  landingPath: string;
  utmCampaign: string;
};

export type MicroLaunchCampaignSetup = {
  flightName: string;
  geo: "Greater Montréal";
  language: "FR + EN";
  campaigns: {
    id: string;
    name: string;
    objective: "BNHub booking" | "Host signup" | "Retargeting";
    adGroups: AdGroupSpec[];
    headlines: string[];
    descriptions: string[];
  }[];
};

export function buildMicroLaunchCampaignSetup(): MicroLaunchCampaignSetup {
  return {
    flightName: "LECIPM_First100_CAD_Micro_v1",
    geo: "Greater Montréal",
    language: "FR + EN",
    campaigns: [
      {
        id: "bnhub_stays_mtl",
        name: "BNHub — Stays (primary revenue)",
        objective: "BNHub booking",
        adGroups: [
          {
            id: "ag_str_core",
            name: "Short-term core",
            keywords: [
              ...MONTREAL_KEYWORD_BANK.slice(0, 2),
              "Montreal vacation rental",
              "Plateau short stay",
            ],
            landingPath: "/lp/rent",
            utmCampaign: "first100_bnhub_stays",
          },
          {
            id: "ag_str_downtown",
            name: "Downtown intent",
            keywords: ["downtown Montreal hotel alternative", "Old Montreal stay", "BNHub Montreal"],
            landingPath: "/lp/rent",
            utmCampaign: "first100_bnhub_dt",
          },
        ],
        headlines: [
          "Book a Montréal stay — BNHub",
          "Short stays with clear pricing",
          "Secure checkout on LECIPM",
          "Find nights in Greater Montréal",
          "Guests trust structured booking",
          "Search dates · compare stays",
          "From browse to confirmed stay",
          "Québec stays marketplace",
          "Transparent fees where shown",
          "LECIPM — BNHub nights",
        ],
        descriptions: [
          "Explore short-term stays in Montréal with BNHub — pricing and availability before you commit.",
          "Checkout with Stripe where enabled; built for guests who want fewer surprises.",
          "Hosts and guests on one Québec-focused platform.",
          "Compare options across neighbourhoods and book when you are ready.",
          "LECIPM: operations-friendly tools for hosts and a smooth guest path.",
        ],
      },
      {
        id: "host_list_mtl",
        name: "Host — List your stay",
        objective: "Host signup",
        adGroups: [
          {
            id: "ag_host_intent",
            name: "Host intent",
            keywords: ["list short term rental Montreal", "host guests Montreal", "Airbnb alternative Quebec"],
            landingPath: "/lp/host",
            utmCampaign: "first100_host",
          },
        ],
        headlines: [
          "List your Montréal stay",
          "Host on LECIPM BNHub",
          "Calendar + payouts in one place",
          "Reach Québec travelers",
          "Professional host tools",
          "Stripe-backed guest checkout",
          "Start hosting with clarity",
          "Your property. Your rules.",
          "Short stays made manageable",
          "Join BNHub hosts",
        ],
        descriptions: [
          "Publish your stay, set availability, and accept reservations with tools built for operators.",
          "BNHub: listing wizard and messaging aligned with Québec operations.",
          "Secure flows where enabled — focus on hospitality, not spreadsheet chaos.",
          "Onboard with structured steps — fewer back-and-forth messages.",
          "LECIPM marketplace for serious hosts in Montréal.",
        ],
      },
      {
        id: "rtg_warm_mtl",
        name: "Retargeting — warm traffic",
        objective: "Retargeting",
        adGroups: [
          {
            id: "ag_rtg_lp",
            name: "LP visitors",
            keywords: ["Montreal stay", "LECIPM booking", "BNHub return"],
            landingPath: "/lp/rent",
            utmCampaign: "first100_rtg",
          },
        ],
        headlines: [
          "Still looking in Montréal?",
          "Finish your stay search",
          "Your dates — better matches",
          "Return to BNHub",
          "Book when you are ready",
          "Less friction. Clear pricing.",
          "Québec stays — one hub",
          "Pick up where you left off",
          "Secure guest checkout",
          "LECIPM BNHub",
        ],
        descriptions: [
          "Pick up your stay search — structured booking and transparent steps on LECIPM.",
          "Retargeting helps you compare without starting from zero.",
          "Availability and pricing signals before checkout.",
          "Built for busy travelers planning Montréal trips.",
          "Trust-forward flows for guests and hosts.",
        ],
      },
    ],
  };
}
