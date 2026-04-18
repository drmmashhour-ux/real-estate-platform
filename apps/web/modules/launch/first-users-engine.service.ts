/**
 * First 100 users — structured daily acquisition plan + optional DB audit (additive).
 * Does not send messages or spend ad budget.
 */
import { prisma } from "@/lib/db";

export type AcquisitionChannelTag = "facebook" | "tiktok" | "dm" | "broker" | "classified";

export type DailyLaunchAcquisitionPlan = {
  date: string;
  city: string;
  source: "organic_manual";
  facebookGroupsToPost: { name: string; angle: string; utmHint: string }[];
  dmOutreachScripts: { label: string; script: string }[];
  socialContentIdeas: { platform: "tiktok" | "instagram"; idea: string; hook: string }[];
  classifiedListings: { title: string; body: string; category: "craigslist" | "kijiji" }[];
  brokerOutreachActions: { title: string; action: string; followUp: string }[];
};

const FB_GROUPS = [
  { name: "Montreal Housing / Logement Montréal", angle: "BNHub stays + transparent fees", utmHint: "utm_campaign=fb_mtl_housing_v1" },
  { name: "Newcomers to Montreal", angle: "Short stays while apartment hunting", utmHint: "utm_campaign=fb_mtl_newcomers_v1" },
  { name: "McGill / Concordia Off-Campus Housing", angle: "Weekend stays for parents & visitors", utmHint: "utm_campaign=fb_mtl_campus_v1" },
  { name: "Airbnb Hosts — Québec", angle: "Host stack on LECIPM (no auto-spend pitch)", utmHint: "utm_campaign=fb_qc_hosts_v1" },
  { name: "Real Estate Investors — Montréal", angle: "BNHub + marketplace discovery", utmHint: "utm_campaign=fb_mtl_invest_v1" },
  { name: "Laval & North Shore Rentals", angle: "Cross-city stays + search", utmHint: "utm_campaign=fb_laval_v1" },
  { name: "Plateau / Mile-End Community", angle: "Local stays & events weekend", utmHint: "utm_campaign=fb_plateau_v1" },
  { name: "Remote Workers Montréal", angle: "Quiet stays for work trips", utmHint: "utm_campaign=fb_remote_mtl_v1" },
  { name: "Family Activities Montreal", angle: "Kid-friendly BNHub filters", utmHint: "utm_campaign=fb_families_mtl_v1" },
  { name: "Montreal Entrepreneurs / Side Hustle", angle: "List space — manual payout options", utmHint: "utm_campaign=fb_sidehustle_mtl_v1" },
] as const;

/** Deterministic daily acquisition plan for operators. */
export function generateDailyLaunchActions(date = new Date(), city = "Montreal"): DailyLaunchAcquisitionPlan {
  const iso = date.toISOString().slice(0, 10);
  const day = date.getUTCDate();
  const rotate = <T,>(arr: readonly T[], offset: number): T[] => [...arr.slice(offset), ...arr.slice(0, offset)];

  const groups = rotate(FB_GROUPS, day % FB_GROUPS.length).slice(0, 10);

  const dmOutreachScripts: DailyLaunchAcquisitionPlan["dmOutreachScripts"] = [
    {
      label: "Warm intro (host)",
      script: `Hey — I’m helping spread the word on LECIPM/BNHub in ${city}: calendar + payouts options hosts actually control. If you ever list a short stay, want a 2‑min walkthrough?`,
    },
    {
      label: "Broker bridge",
      script: `Quick note: we’re onboarding ${city} inventory with CRM-ready leads on LECIPM. Open to a 15m intro call this week?`,
    },
    {
      label: "Guest pain",
      script: `Planning a trip to ${city}? BNHub on LECIPM shows total pricing before pay — want the link with UTM so you can compare?`,
    },
    {
      label: "Investor angle",
      script: `If you track STR performance in ${city}, LECIPM surfaces listings + BNHub checkout — happy to share the LP tuned for investors.`,
    },
    {
      label: "Operator follow-up",
      script: `Following up — did the ${city} landing page load OK on mobile? I can send the host vs guest link you asked for.`,
    },
  ];

  const socialContentIdeas: DailyLaunchAcquisitionPlan["socialContentIdeas"] = [
    {
      platform: "tiktok",
      idea: `"Price shock vs total" — 20s screen record of checkout line items in ${city}.`,
      hook: "Stop guessing fees — here’s the total before you pay.",
    },
    {
      platform: "instagram",
      idea: `Carousel: 3 BNHub filters guests actually use in ${city} (dates, guests, price).`,
      hook: "Weekend in Montréal — pick dates, see real totals.",
    },
    {
      platform: "tiktok",
      idea: `Host POV: calendar sync + message speed — why response time matters.`,
      hook: "Hosts: faster replies → more bookings (platform nudges only).",
    },
  ];

  const classifiedListings: DailyLaunchAcquisitionPlan["classifiedListings"] = [
    {
      title: `${city} — BNHub stays & STR discovery (LECIPM)`,
      body: `Browse short-term stays with transparent totals. Platform: LECIPM — search BNHub for ${city}. No spam; UTM-tracked links only.`,
      category: "kijiji",
    },
    {
      title: `Looking for a stay in ${city}? Try BNHub (guest-protected checkout)`,
      body: `Compare listings side by side. LECIPM — book when ready; test-mode friendly for hosts.`,
      category: "craigslist",
    },
    {
      title: `Host your space — ${city} (manual or Stripe Connect payouts)`,
      body: `LECIPM BNHub: listing tools + messaging. You control pricing; platform does not auto-spend ads for you.`,
      category: "kijiji",
    },
  ];

  const brokerOutreachActions: DailyLaunchAcquisitionPlan["brokerOutreachActions"] = [
    {
      title: "Coffee + CRM demo",
      action: `Invite 1 ${city} brokerage ops lead to Admin growth funnel + lead capture stats.`,
      followUp: "Send summary email with UTM best practices for listing links.",
    },
    {
      title: "Co-branded LP",
      action: `Offer /ads/buy style LP with broker UTM — measure broker_lead vs landing_view.`,
      followUp: "Check CRM for duplicate leads; dedupe by email.",
    },
  ];

  return {
    date: iso,
    city,
    source: "organic_manual",
    facebookGroupsToPost: groups.map((g) => ({ ...g })),
    dmOutreachScripts,
    socialContentIdeas,
    classifiedListings,
    brokerOutreachActions,
  };
}

/** Persist one engine run for analytics / audit (optional). */
export async function persistLaunchActionsLog(plan: DailyLaunchAcquisitionPlan): Promise<{ id: string }> {
  const row = await prisma.launchActionLog.create({
    data: {
      runDate: new Date(plan.date + "T12:00:00.000Z"),
      city: plan.city,
      source: plan.source,
      channel: "engine",
      payloadJson: plan as object,
    },
    select: { id: true },
  });
  return row;
}
