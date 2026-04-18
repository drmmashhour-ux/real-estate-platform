/**
 * LECIPM launch + scale strategy — planning metadata only. No external API calls; no auto-spend.
 */

export type AdsChannel = {
  id: string;
  name: string;
  rationale: string;
  /** Relative priority 1 = highest */
  priority: number;
};

export type CampaignPriority = {
  id: string;
  label: string;
  objective: string;
  primaryKpi: string;
};

export type CreativeRecommendation = {
  theme: string;
  hook: string;
  format: "feed" | "stories" | "search_rsa";
};

export type LaunchAdsStrategy = {
  bestChannels: AdsChannel[];
  campaignPriorities: CampaignPriority[];
  audienceSuggestions: string[];
  dailyBudgetsCad: { testMin: number; testMax: number; optimizeBand: string; scaleBand: string };
  creativeRecommendations: CreativeRecommendation[];
  kpisToWatch: string[];
  notes: string[];
};

export type BudgetPlanPhase = {
  label: string;
  dailyBudgetCadRange: string;
  focus: string;
};

export type ScalePlanPayload = {
  phase_1_test: BudgetPlanPhase;
  phase_2_optimize: BudgetPlanPhase;
  phase_3_scale: BudgetPlanPhase;
  budgetThresholds: { pauseCplCad: number; scaleCtrMinPercent: number; minLeadsBeforeScale: number };
  stopRules: string[];
  scaleRules: string[];
  /** Structured mirror for dashboards / exports */
  channels: AdsChannel[];
  campaigns: CampaignPriority[];
  budgetPlan: {
    day1to5: { cadPerDay: string; actions: string[] };
    day6to10: { cadPerDay: string; actions: string[] };
    day10plus: { cadPerDay: string; actions: string[] };
  };
  metricsTargets: {
    ctrSearchPercent: string;
    ctrSocialPercent: string;
    landingToLeadPercent: string;
    cplTargetCad: string;
  };
};

/**
 * Channel mix + KPIs for Québec marketplace launch (BNHub + resale + brokers).
 */
export function buildLaunchAdsStrategy(city = "Montréal"): LaunchAdsStrategy {
  return {
    bestChannels: [
      {
        id: "google_search",
        name: "Google Ads — Search",
        rationale: "High intent for rent/buy/STR queries; pair with `/ads/*` landings + UTMs.",
        priority: 1,
      },
      {
        id: "meta_feed",
        name: "Meta — Feed + Reels",
        rationale: "Creative testing for host/guest personas; use Advantage+ cautiously until CVR stabilizes.",
        priority: 2,
      },
      {
        id: "organic_groups",
        name: "Facebook groups + DMs",
        rationale: "Trust-heavy; slower volume, strong for first hosts/brokers in-market.",
        priority: 3,
      },
    ],
    campaignPriorities: [
      {
        id: "bnhub_guest",
        label: "BNHub guest — stays",
        objective: "Traffic → booking_started",
        primaryKpi: "Cost per landing session + booking_started rate",
      },
      {
        id: "bnhub_host",
        label: "BNHub host acquisition",
        objective: "Leads / listing_created",
        primaryKpi: "Cost per qualified host lead",
      },
      {
        id: "buyer_resale",
        label: "Buyer / renter — marketplace",
        objective: "Leads (CRM)",
        primaryKpi: "Cost per broker-ready lead",
      },
      {
        id: "broker",
        label: "Broker workspace",
        objective: "Leads + activation",
        primaryKpi: "Cost per onboarded broker (manual)",
      },
    ],
    audienceSuggestions: [
      `${city} +15–25 km; languages FR/EN`,
      "Interests: short-term rental, Airbnb, travel, real estate investing",
      "Interests: first-time buyer, mortgage, home ownership",
      "Professional: real estate agents / brokers (Meta job titles where available)",
    ],
    dailyBudgetsCad: {
      testMin: 20,
      testMax: 35,
      optimizeBand: "$45–75/day once 2+ creatives show stable CTR",
      scaleBand: "$100–300/day only after repeatable CAC vs LTV guardrails",
    },
    creativeRecommendations: [
      { theme: "Proof-first", hook: "Real listings pulled from LECIPM — no fake scarcity.", format: "feed" },
      { theme: "Host upside", hook: "Calendar + pricing control; you approve what goes live.", format: "stories" },
      { theme: "Search intent", hook: "Match query in headline (city + rent/buy/STR).", format: "search_rsa" },
    ],
    kpisToWatch: [
      "CTR (placement-specific)",
      "Landing_view → lead_capture (MI funnel)",
      "CRM leadSource `ads_landing_public` volume + duplicate rate",
      "booking_started → booking_completed (BNHub)",
      "Spend pacing vs daily cap (manual in Ads Manager)",
    ],
    notes: [
      "LECIPM never pushes budgets via API — operators set caps in Meta/Google.",
      "Pause or scale using rules from `buildScalePlan()`; all metrics must come from real events/CRM.",
    ],
  };
}

/**
 * Phased test → optimize → scale with explicit guardrails (human execution).
 */
export function buildScalePlan(): ScalePlanPayload {
  return {
    phase_1_test: {
      label: "Phase 1 — test",
      dailyBudgetCadRange: "$20–$30 / day / major channel",
      focus: "2–3 creatives × 2 audiences; gather 50+ clicks or 20+ landing sessions before judging.",
    },
    phase_2_optimize: {
      label: "Phase 2 — optimize",
      dailyBudgetCadRange: "~$50 / day on winning ad sets",
      focus: "Turn off bottom quartile by CTR; refresh hooks; tighten locations.",
    },
    phase_3_scale: {
      label: "Phase 3 — scale",
      dailyBudgetCadRange: "$100–$300 / day",
      focus: "Duplicate winners only; broaden interest stacks slowly; add retargeting (7d site/engagement).",
    },
    budgetThresholds: {
      pauseCplCad: 120,
      scaleCtrMinPercent: 0.9,
      minLeadsBeforeScale: 15,
    },
    stopRules: [
      "Pause ad set if spend > 3× target CPL and <2 qualified leads in 7 days (confirm tracking first).",
      "Pause if landing_view → lead_capture collapses vs prior week and nothing changed on-site.",
      "Pause if frequency > 4 in 7d and CTR drops >30% — creative fatigue.",
    ],
    scaleRules: [
      "Scale budget ≤20% every 3–4 days on winners (stable CPL + sufficient lead volume).",
      "Duplicate ad set only after ≥5 conversions at target CPL in 14 days.",
      "Broaden audience only when CTR holds and CPL does not regress >25%.",
    ],
    channels: buildLaunchAdsStrategy().bestChannels,
    campaigns: buildLaunchAdsStrategy().campaignPriorities,
    budgetPlan: {
      day1to5: {
        cadPerDay: "$20–$30",
        actions: ["Launch 2 ad sets", "Verify UTMs + pixel/GA4 (if used)", "Check `/dashboard/growth` daily"],
      },
      day6to10: {
        cadPerDay: "$35–$55",
        actions: ["Kill weakest creative", "Add exact-match keywords (Google)", "Retarget engaged visitors"],
      },
      day10plus: {
        cadPerDay: "$60–$300 (conditional)",
        actions: ["Scale winners per rules", "Introduce LAL/lookalike only with seed ≥500 (Meta guideline)", "Review broker + host supply weekly"],
      },
    },
    metricsTargets: {
      ctrSearchPercent: "≥4% (Search RSA — brand + city terms; lower for broad)",
      ctrSocialPercent: "≥0.9% (Feed) / ≥0.5% (Reels) — platform-dependent",
      landingToLeadPercent: "≥2% on cold traffic; higher on retargeting",
      cplTargetCad: "$40–$120 depending on vertical (guest vs broker)",
    },
  };
}
