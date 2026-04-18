/**
 * First 100 users — segmented acquisition playbook (hosts / guests / buyers / brokers).
 * Complements `first-100-users.service.ts` (channel mix); this file focuses on quotas + templates.
 */

export type UserSegment = "bnhub_host" | "guest" | "buyer_renter" | "broker";

export type FirstUsersSegmentQuota = {
  segment: UserSegment;
  label: string;
  targetCount: number;
  rationale: string;
};

export type OutreachTemplates = {
  dmCold: string;
  emailBroker: string;
  emailHostInvite: string;
  offerStrategy: string[];
};

export type FirstUsersAcquisitionPack = {
  city: string;
  goalTotal: 100;
  segments: FirstUsersSegmentQuota[];
  outreach: OutreachTemplates;
  complianceNotes: string[];
};

/** 30 + 40 + 20 + 10 = 100 — illustrative split for planning; actuals come from CRM. */
export function buildFirstUsersAcquisitionPack(city = "Montréal"): FirstUsersAcquisitionPack {
  const segments: FirstUsersSegmentQuota[] = [
    {
      segment: "bnhub_host",
      label: "BNHub hosts",
      targetCount: 30,
      rationale: "Supply-side density for booking liquidity and reviews.",
    },
    {
      segment: "guest",
      label: "Guests / bookers",
      targetCount: 40,
      rationale: "Demand + repeat visits; measure booking_completed funnel.",
    },
    {
      segment: "buyer_renter",
      label: "Buyers & long-term renters",
      targetCount: 20,
      rationale: "FSBO + CRM leads; pairs with broker handoff when needed.",
    },
    {
      segment: "broker",
      label: "Brokers",
      targetCount: 10,
      rationale: "B2B trust; smaller count, higher leverage on listings volume.",
    },
  ];

  const outreach: OutreachTemplates = {
    dmCold: `Hey — we’re opening more inventory in ${city} on LECIPM (BNHub + listings). If you’re comparing stays or homes, want a 2‑min tour of the search + booking flow? No pressure — happy to share a link with UTM so you can see it live.`,
    emailBroker: `Subject: ${city} — LECIPM broker preview\n\nHi,\nWe’re onboarding a limited set of brokers in ${city} for listing + lead tools (CRM handoff, no spam blasts). If you’re open to a 15‑min screenshare this week, reply with a slot — we’ll send a single calendar link.`,
    emailHostInvite: `Subject: List your ${city} space — BNHub\n\nHi,\nBNHub helps travelers book verified stays. We’re prioritizing hosts in ${city} for the soft launch: fast onboarding, transparent fees, and host dashboard analytics. Reply “interested” and we’ll send next steps.`,
    offerStrategy: [
      "Early hosts: priority placement in city browse while inventory ramps (disclose duration in writing).",
      "Guests: no fake discounts — use real promo codes from billing if configured.",
      "Brokers: co-marketing kit (UTM + blog drafts) instead of cash incentives by default.",
    ],
  };

  return {
    city,
    goalTotal: 100,
    segments,
    outreach,
    complianceNotes: [
      "Canada anti-spam / consent: record opt-in for marketing; transactional emails separate.",
      "Do not purchase lists — outreach to people with reasonable expectation of contact only.",
    ],
  };
}
