import type { InvestorMetricRow } from "@/modules/investor-metrics/investor-metrics.types";

import type { PitchSlideVm } from "./investor-pitch.types";

const SLIDE_IDS = [
  "title",
  "problem",
  "solution",
  "product",
  "ai",
  "market",
  "business_model",
  "traction",
  "growth",
  "vision",
] as const;

export function buildTenSlidePitchDeck(opts: {
  sampleMode: boolean;
  metricsRows?: InvestorMetricRow[];
}): PitchSlideVm[] {
  const rows = opts.metricsRows ?? [];
  const users = rows.find((r) => r.metric === "total_users")?.value;
  const listings = rows.find((r) => r.metric === "total_live_listings")?.value;
  const bookings = rows.find((r) => r.metric === "bookings_confirmed_completed_30d")?.value;
  const rev = rows.find((r) => r.metric === "revenue_events_sum_30d")?.value;

  const tractionBullets =
    opts.sampleMode || typeof users !== "number"
      ? ["Toggle sample mode off for DB-backed KPIs.", "Exports available as JSON/CSV when APIs enabled."]
      : [
          `Registered users: ${users}.`,
          typeof listings === "number" ? `Live listings: ${listings}.` : "Listings — see metrics export.",
          typeof bookings === "number" ? `30d bookings (confirmed/completed window): ${bookings}.` : "",
          typeof rev === "number" ? `Revenue events sum (30d): ${rev}.` : "",
        ].filter(Boolean);

  const slides: PitchSlideVm[] = [
    {
      index: 1,
      id: "title",
      title: "LECIPM",
      bullets: ["Luxury real estate operating system", "Multi-hub · AI-augmented · Québec-first density"],
    },
    {
      index: 2,
      id: "problem",
      title: "Problem",
      bullets: [
        "Fragmented stacks for stays vs resale vs financing.",
        "Trust + compliance overhead slows conversion at the premium tier.",
      ],
    },
    {
      index: 3,
      id: "solution",
      title: "Solution",
      bullets: ["Unified hubs with shared identity & payments posture", "Broker-grade workflows without legacy UI debt"],
    },
    {
      index: 4,
      id: "product",
      title: "Product — multi-hub",
      bullets: ["BNHub · Broker CRM · Listings · Residence · Investor capital", "Cross-surface analytics and exports"],
    },
    {
      index: 5,
      id: "ai",
      title: "AI layer",
      bullets: ["Review-first assistance and routing signals", "No silent regulated decisions — escalation paths explicit"],
    },
    {
      index: 6,
      id: "market",
      title: "Market opportunity",
      bullets: [
        "Premium journeys reward integrated discovery → contract → payout.",
        "AI-native expectations without sacrificing auditability.",
      ],
    },
    {
      index: 7,
      id: "business_model",
      title: "Business model",
      bullets: ["Take-rate + monetized leads + subscriptions/tooling", "Expand ARPU as metro liquidity compounds"],
    },
    {
      index: 8,
      id: "traction",
      title: "Traction",
      bullets: tractionBullets,
    },
    {
      index: 9,
      id: "growth",
      title: "Growth strategy",
      bullets: [
        "Acquisition CRM + invite redemption on signup.",
        "Marketing Hub assets admin-reviewed — controlled velocity.",
      ],
    },
    {
      index: 10,
      id: "vision",
      title: "Vision",
      bullets: ["Trusted OS for premium property journeys", "Governance-forward automation at scale"],
    },
  ];

  return slides;
}

export const PITCH_SLIDE_INDEX = SLIDE_IDS;
