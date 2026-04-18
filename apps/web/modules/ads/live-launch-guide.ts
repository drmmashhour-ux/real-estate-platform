/**
 * Step-by-step Ads Manager execution — human operators only.
 */

export type LiveLaunchGuide = {
  /** Detailed operator notes */
  facebook: string[];
  google: string[];
  /** Short checklist (Meta / Google UI) */
  facebookHighLevel: string[];
  googleHighLevel: string[];
  utmReminder: string;
};

export function buildLiveAdsLaunchGuide(locale = "en", country = "ca"): LiveLaunchGuide {
  const base = `/${locale}/${country}`;
  return {
    facebookHighLevel: [
      "Go to Ads Manager (business.facebook.com).",
      'Create campaign → objective **Leads** or **Conversions** (match your pixel/CAPI setup).',
      "Set budget: **$20/day** to start (see initial budget plan).",
      "Target **Montréal** (and **Laval** for host campaign).",
      "Paste primary text, headline, and CTA from `getLiveCampaignDefinitions()` for the campaign id.",
      "Creative: **square** image (1:1) or short vertical video.",
      "Destination URL → the campaign landing path + UTMs (see `facebook` notes below).",
    ],
    googleHighLevel: [
      "Create a **Search** campaign.",
      "Add keywords (seed): **airbnb investment montreal**, **rent apartment montreal**, **buy property montreal** — refine with match types and Search Terms.",
      "Add responsive search ad headlines/descriptions (reuse live campaign copy + LECIPM Google packs).",
      "Set budget starting **$20/day**.",
      "Final URL + UTMs on the correct `/ads/*` path → launch paused, then enable after QA.",
    ],
    facebook: [
      "Open Meta Ads Manager (business.facebook.com) and select the correct ad account + payment method.",
      "Create campaign → objective **Leads** or **Sales** (only if pixel/CAPI is healthy); for cold traffic tests prefer **Traffic** to `/ads/*` first if learning phase is unstable.",
      "Set daily budget starting at **$20/day** (see `getInitialBudgetPlan()`).",
      "Ad set: location **Montréal + Laval** (or campaign-specific); age per live campaign card; placements Feed + Stories first.",
      "Paste **primary text + headline + CTA** from `getLiveCampaignDefinitions()` for the matching campaign id.",
      "Destination URL: `https://YOUR_DOMAIN" + base + "/ads/host` (hosts), `/ads/bnhub/stays` or `/ads/bnhub` (guests), `/ads/buy` (buyers) + **UTM**: `?utm_source=facebook&utm_medium=paid&utm_campaign=lecipm_live_*_v1`.",
      "Creative: 1:1 or 4:5 image or ≤15s video — no misleading “guaranteed income” claims.",
      "Publish **paused** → preview on mobile → enable when QA passes.",
    ],
    google: [
      "Google Ads → **Search** campaign (new).",
      "Locations: Montréal + relevant radius; languages FR/EN.",
      "Ad groups + keywords (seed): **airbnb investment montreal**, **rent apartment montreal**, **buy property montreal** — expand via Search Terms report after data arrives.",
      "Ads: Responsive Search Ads — paste headlines/descriptions from LECIPM Google packs or live campaign copy.",
      "Budget: start **$20/day**; use exact + phrase match before broad.",
      "Final URL + UTMs: `utm_source=google&utm_medium=cpc&utm_campaign=lecipm_live_search_v1`.",
      "Launch paused → verify policy + LP → enable.",
    ],
    utmReminder: "Every paid link must carry UTMs so `/dashboard/growth` and Marketing Intelligence stay attributable.",
  };
}
