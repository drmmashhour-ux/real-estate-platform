/**
 * LECIPM Soft Launch Engine v1 — strategy only; budgets are planning bands (no auto-spend).
 * Integrates with Marketing System v2 events for measurement (real rows only).
 */

export type SoftLaunchWeeklyRow = {
  week: number;
  focus: string;
  measurableKpis: string[];
};

export type SoftLaunchPlan = {
  targetUsers: 100;
  budgetUsd: { min: number; max: number };
  channels: string[];
  weeklyPlan: SoftLaunchWeeklyRow[];
  /** Planning range only — actual CAC comes from reported spend + lead/booking events. */
  expectedCacUsd: { low: number; high: number };
  /** Illustrative range — real conversion from funnel + ROI APIs. */
  expectedConversionRatePercent: { low: number; high: number };
  actions: string[];
  tracking: {
    eventsApi: string;
    leadCaptureApi: string;
    notes: string[];
  };
};

export function generateSoftLaunchPlan(city = "Montréal"): SoftLaunchPlan {
  return {
    targetUsers: 100,
    budgetUsd: { min: 100, max: 500 },
    channels: [
      "Google Ads",
      "Facebook Groups",
      "Direct Outreach",
      "Broker Network",
      "Organic Blog SEO",
    ],
    weeklyPlan: [
      {
        week: 1,
        focus: `Baseline tracking + UTM discipline (${city})`,
        measurableKpis: ["landing_view", "ad_click", "lead_capture"],
      },
      {
        week: 2,
        focus: "Test 2–3 creative angles; keep spend in budget band",
        measurableKpis: ["listing_view", "cost per click (external)", "lead_capture"],
      },
      {
        week: 3,
        focus: "Double down on lowest CAC channel (data from ROI dashboard)",
        measurableKpis: ["lead_capture", "booking_completed"],
      },
      {
        week: 4,
        focus: "Broker + host referrals; tighten follow-up SLA",
        measurableKpis: ["lead_capture", "repeat sessions"],
      },
      {
        week: 6,
        focus: "Scale only if reported ROI > 0 vs attributed spend",
        measurableKpis: ["revenue events", "spend events"],
      },
      {
        week: 8,
        focus: "Target ~100 cumulative real users; cohort quality review",
        measurableKpis: ["signup", "booking_completed", "retention proxy"],
      },
    ],
    expectedCacUsd: { low: 3, high: 45 },
    expectedConversionRatePercent: { low: 0.5, high: 6 },
    actions: [
      "Run ads externally — use generated copy from Ads Engine; never enable auto-spend here.",
      "Tag every link with UTM; map to `campaign` / `source` on lead capture.",
      "Record funnel steps via POST /api/marketing-system/v2/events (performance + funnel).",
      "Publish blog posts and use Distribution pack (COPY / share links only).",
      "Review /dashboard/growth/reports weekly; pause channels with negative ROI vs reported spend.",
    ],
    tracking: {
      eventsApi: "/api/marketing-system/v2/events",
      leadCaptureApi: "/api/growth/leads/capture",
      notes: [
        "No fabricated metrics — charts reflect stored MarketingSystemEvent rows.",
        "BNHub booking + Stripe revenue already emit via Marketing Intelligence activation when enabled.",
      ],
    },
  };
}
