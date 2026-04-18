/**
 * Human-readable Ads Manager setup guides — not automation.
 */

export type AdsManagerGuide = {
  platform: "meta" | "google";
  title: string;
  objectiveToPick: string;
  audienceSetup: string[];
  budgetInput: string[];
  placements: string[];
  creativeInput: string[];
  cta: string[];
  urlUtmStructure: string[];
  avoid: string[];
};

export function buildMetaAdsManagerGuide(city = "Montréal"): AdsManagerGuide {
  const c = city.trim() || "Montréal";
  return {
    platform: "meta",
    title: "Facebook / Instagram Ads Manager — setup checklist",
    objectiveToPick: "Start with **Traffic** for BNHub exploration or **Leads** for broker/buyer capture. Avoid Sales objectives until pixel/CAPI proof exists.",
    audienceSetup: [
      `Locations: ${c} +15–25 km; exclude irrelevant countries.`,
      "Languages: French + English for Québec.",
      "Detailed targeting: stack 3–5 interests max per ad set for learning phase clarity.",
      "Create separate ad sets for host vs guest — do not mix objectives in one ad set.",
    ],
    budgetInput: [
      "Campaign budget or ad set budget — pick one structure and keep consistent.",
      "Daily cap: align with `buildScalePlan()` test band; use account spending limit as backstop.",
      "Schedule: run 5–7 consecutive days minimum before major changes.",
    ],
    placements: [
      "Test: Feed + Stories; add Reels only after baseline CTR.",
      "Avoid automatic placements that burn budget on low-intent surfaces until performance proven.",
    ],
    creativeInput: [
      "Use 1:1 and 4:5 assets; keep text in safe zones (20% text rule legacy guidance).",
      "3 primary text variants per ad set; duplicate winners instead of editing in-flight.",
    ],
    cta: [
      "Match CTA to intent: Book Now / Learn More / Sign Up / Get Quote.",
      "Ensure destination matches `/ads/*` landings with UTMs appended.",
    ],
    urlUtmStructure: [
      "Minimum: `utm_source=facebook&utm_medium=paid&utm_campaign=lecipm_{persona}_{city}_v1`",
      "Add `utm_content` for creative ID; `utm_term` for ad set name if useful internally.",
    ],
    avoid: [
      "No engagement bait that violates Meta policies.",
      "No discriminatory targeting — follow Meta Special Ad Categories where required.",
      "No budget changes >20% day-on-day during learning phase.",
    ],
  };
}

export function buildGoogleAdsManagerGuide(city = "Montréal"): AdsManagerGuide {
  const c = city.trim() || "Montréal";
  return {
    platform: "google",
    title: "Google Ads — Search setup checklist",
    objectiveToPick: "Sales / Leads / Traffic depending on LP; prefer **Search** campaigns for intent capture.",
    audienceSetup: [
      `Locations: ${c} + surrounding metros; verify geo reports weekly.`,
      "Audience segments: add observational only (not required day 1).",
    ],
    budgetInput: [
      "Start with shared budget across ad groups or single campaign for clarity.",
      "Use ad schedule once baseline data exists.",
    ],
    placements: [
      "Search Network on; Display off until Search CPL healthy.",
      "Search Partners optional — monitor placement reports.",
    ],
    creativeInput: [
      "RSA: fill 15 headlines + 4 descriptions from `listGoogleCampaignPacks()`.",
      "Pin brand + city terms in headline positions 1–2 if quality score is weak.",
    ],
    cta: [
      "Use sitelinks + structured snippets when eligible.",
      "Call extensions only if staffed.",
    ],
    urlUtmStructure: [
      "`utm_source=google&utm_medium=cpc&utm_campaign={campaign_name}`",
      "Use `{keyword}` in tracking templates only if policy-compliant for your account.",
    ],
    avoid: [
      "Broad match without smart bidding + conversion volume — risky early.",
      "Generic DKI without negatives — can attract junk queries.",
    ],
  };
}
