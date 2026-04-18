/**
 * First ~100 users — conservative channel mix (not a promise of volume).
 * Aligns actions with measurable `growth_events` + CRM discipline.
 */

export type AcquisitionChannel = {
  id: string;
  name: string;
  /** Rough expected users over 8–12 weeks at bootstrap effort. */
  expectedUsersLow: number;
  expectedUsersHigh: number;
  primaryMetric: string;
  /** Maps to UTM / campaign naming. */
  trackingHint: string;
};

export type First100UsersPlan = {
  city: string;
  goalUsers: number;
  horizonWeeks: number;
  channels: AcquisitionChannel[];
  expectedUsersTotal: { low: number; high: number };
  timeline: { week: number; focus: string }[];
  actions: string[];
  risks: string[];
};

export function buildFirst100UsersPlan(city = "Montreal"): First100UsersPlan {
  const channels: AcquisitionChannel[] = [
    {
      id: "google_ads",
      name: "Google Ads (BNHub + LP)",
      expectedUsersLow: 15,
      expectedUsersHigh: 35,
      primaryMetric: "signup_success + booking_started",
      trackingHint: "utm_source=google; compare to MONTREAL_READY_CAMPAIGNS",
    },
    {
      id: "facebook_groups",
      name: "Facebook groups (housing / newcomers)",
      expectedUsersLow: 10,
      expectedUsersHigh: 25,
      primaryMetric: "landing page views + broker_lead",
      trackingHint: "utm_medium=social; manual post links with utm_campaign=fb_mtl_v1",
    },
    {
      id: "whatsapp_network",
      name: "WhatsApp / personal network",
      expectedUsersLow: 8,
      expectedUsersHigh: 20,
      primaryMetric: "signup_success",
      trackingHint: "referral ref codes + signup_attribution_json",
    },
    {
      id: "broker_outreach",
      name: "Broker outreach (1:1)",
      expectedUsersLow: 10,
      expectedUsersHigh: 22,
      primaryMetric: "broker leads + listings",
      trackingHint: "CRM + broker_lead events on /lp/buy",
    },
    {
      id: "campus",
      name: "Campus / student housing adjacent",
      expectedUsersLow: 5,
      expectedUsersHigh: 15,
      primaryMetric: "page_view /lp/rent + signup",
      trackingHint: "utm_campaign=campus_mtl; keep messaging compliant",
    },
  ];

  const low = channels.reduce((a, c) => a + c.expectedUsersLow, 0);
  const high = channels.reduce((a, c) => a + c.expectedUsersHigh, 0);

  return {
    city,
    goalUsers: 100,
    horizonWeeks: 10,
    channels,
    expectedUsersTotal: { low, high },
    timeline: [
      { week: 1, focus: "Ship tracking + Montreal presets live; $500 test on BNHub LP" },
      { week: 2, focus: "Broker intros + 2 FB posts; measure CPA vs signup_success" },
      { week: 3, focus: "Host LP + listing_created events; tighten retargeting lists" },
      { week: 4, focus: "Double down on lowest CPA channel (data-driven)" },
      { week: 6, focus: "Scale to $750–1000 if ROAS proxy > 0.5× on BNHub line" },
      { week: 10, focus: "Target 100 cumulative users; cohort quality review" },
    ],
    actions: [
      "Create 4 Montreal campaigns in Google Ads using `/api/ads/montreal-presets` copy.",
      "Add UTM to every outbound link (WhatsApp, email, groups).",
      "Weekly review: Admin → Analytics growth_events funnel vs traffic_events.",
      "Prioritize BNHub paid bookings: follow up booking_started without booking_completed within 24h.",
      "Capture broker conversations as broker_lead or CRM notes — avoid dark traffic.",
    ],
    risks: [
      "CPC and CVR vary by week — reforecast using dashboard, not this static plan.",
      "Student/campus messaging may need institution permissions — verify locally.",
    ],
  };
}

export type DailyLaunchActions = {
  actions: string[];
};

/** Rotates suggested daily tasks from the first-100 plan (deterministic by date). */
export function generateDailyLaunchActions(date: Date, city = "Montreal"): DailyLaunchActions {
  const plan = buildFirst100UsersPlan(city);
  const pool = [...plan.actions, ...plan.timeline.map((t) => `Week ${t.week}: ${t.focus}`)];
  const start = date.getUTCDate() % pool.length;
  const actions = [...pool.slice(start), ...pool.slice(0, start)].slice(0, 6);
  return { actions };
}
