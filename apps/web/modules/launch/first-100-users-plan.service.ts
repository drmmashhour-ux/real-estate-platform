/**
 * First 100 users — operating plan (segment quotas + scripts). Additive to `first-100-users.service.ts`.
 * No auto-outreach; humans send messages.
 */

export type First100Segment = {
  id: "hosts" | "guests" | "buyers_renters" | "brokers";
  targetUsers: number;
  channels: string[];
};

export type First100UsersOperatingPlan = {
  city: string;
  segments: First100Segment[];
  facebookGroupIdeas: { title: string; angle: string }[];
  dmScripts: string[];
  emailScripts: string[];
  shortFormIdeas: { platform: "tiktok" | "instagram"; idea: string }[];
  launchOffers: string[];
  dailyChecklist: string[];
  metrics: string[];
};

/**
 * Quotas: 30 hosts, 40 guests, 20 buyers/renters, 10 brokers = 100.
 */
export function buildFirst100UsersOperatingPlan(city = "Montréal"): First100UsersOperatingPlan {
  const c = city.trim() || "Montréal";
  return {
    city: c,
    segments: [
      {
        id: "hosts",
        targetUsers: 30,
        channels: ["Meta Leads LP `/ads/host`", "Facebook groups (landlord/STR)", "Referrals from first guests"],
      },
      {
        id: "guests",
        targetUsers: 40,
        channels: ["Meta Traffic `/ads/bnhub`", "Google Search BNHub", "Organic TikTok/IG shorts"],
      },
      {
        id: "buyers_renters",
        targetUsers: 20,
        channels: ["Google Search `/ads/buy`", "Broker co-marketing", "Newcomer org partnerships"],
      },
      {
        id: "brokers",
        targetUsers: 10,
        channels: ["Direct LinkedIn/email", "Broker breakfast intro", "OACIQ-adjacent networking (compliant)"],
      },
    ],
    facebookGroupIdeas: [
      { title: `${c} Housing / Rentals (newcomers)`, angle: "Value post: how to compare BNHub stays vs OTAs (neutral, educational)." },
      { title: `Real estate investors — ${c}`, angle: "Ask permission: 3 questions on STR regulation awareness (no legal advice)." },
      { title: `Small landlords ${c}`, angle: "Share checklist: photos + calendar hygiene before going live on any platform." },
    ],
    dmScripts: [
      `Hey {{name}} — we’re onboarding hosts in ${c} on LECIPM BNHub (structured listings + checkout). If you ever list short-term, want a 10-min walkthrough? No pressure.`,
      `Hi {{name}} — saw your comment on {{group}}. We’re tracking real stays in ${c} on LECIPM; happy to share how pricing displays to guests.`,
    ],
    emailScripts: [
      `Subject: ${c} — host listing review (15 min)\nHi {{name}},\nWe’re opening curated BNHub stays in ${c}. If you host or plan to, reply with your neighbourhood — we’ll share the onboarding checklist.\n— {{sender}}`,
      `Subject: Broker pilot — LECIPM workspace\nHi {{name}},\nWe’re inviting a small broker cohort in ${c} to test pipeline + lead routing. If you want a sandbox login, reply “interested”.`,
    ],
    shortFormIdeas: [
      { platform: "tiktok", idea: `"3 taps to see nightly price on BNHub — ${c} edition" screen capture (no misleading rates).` },
      { platform: "instagram", idea: `Carousel: "Host vs OTA fees" educational — consult your accountant disclaimer.` },
      { platform: "instagram", idea: `Reels B-roll: neighbourhood b-roll + CTA "Browse stays · link in bio" with UTM.` },
    ],
    launchOffers: [
      "First 20 verified hosts: fee review call with growth team (not a rate guarantee).",
      "First-time guest booking: highlight BNHub Trust/Guarantee where applicable (policy-bound).",
      "Broker pilot: dedicated onboarding office hours (calendar link) — no cash incentives that violate RECO/OACIQ.",
    ],
    dailyChecklist: [
      "Check `/dashboard/growth` ads landing funnel + CRM duplicates.",
      "Reply to new `ads_landing_public` leads <24h.",
      "Log UTM on every manual post.",
      "Pause ad sets that broke `buildScalePlan()` stop rules.",
      "Export Search Terms (Google) + Placement (Meta) — add 5 negatives.",
    ],
    metrics: [
      "landing_view → lead_capture rate by campaign",
      "Qualified leads/week by segment",
      "booking_started count (BNHub)",
      "Host listing_created / published count",
    ],
  };
}
