/**
 * Social proof *surfaces* — copy must not invent rankings. Numbers come from the same
 * `LeadershipMetrics` / data layer as the leadership dashboard, or are explicitly qualitative.
 */

import type { LeadershipMetrics } from "./leadership-metrics.types";

export type Testimonial = {
  id: string;
  quote: string;
  role: string;
  /** e.g. “Montréal” — do not claim market share */
  marketLabel: string;
};

/** Placeholder quotes for UI; replace with consenting customer quotes in CMS */
export const EXAMPLE_TESTIMONIALS: Testimonial[] = [
  {
    id: "t-1",
    quote:
      "The deal pipeline view finally matches how we run files — we spend less time chasing status and more time with clients.",
    role: "Broker, residential",
    marketLabel: "Montréal",
  },
  {
    id: "t-2",
    quote: "We track engagement from the team in-app; that visibility alone changed our weekly huddles.",
    role: "Team lead",
    marketLabel: "Québec",
  },
];

export type UsageMetricLine = {
  id: string;
  label: string;
  value: string;
  source: "measured" | "qualitative";
};

/**
 * Map raw metrics to display lines — all numeric claims trace to `LeadershipMetrics`.
 */
export function buildUsageMetricLines(m: LeadershipMetrics): UsageMetricLine[] {
  return [
    {
      id: "brokers",
      label: "Active brokers (scope)",
      value: String(m.activeBrokers),
      source: "measured",
    },
    {
      id: "deals",
      label: "Deals closed (90d) in scope",
      value: String(m.dealsProcessed),
      source: "measured",
    },
    {
      id: "engagement",
      label: "Engagement index (0–100%)",
      value: `${Math.round(m.engagementRate * 100)}%`,
      source: "measured",
    },
    {
      id: "revenue",
      label: "Attributed revenue (display)",
      value: (m.revenueCents / 100).toLocaleString(undefined, { maximumFractionDigits: 0 }),
      source: "measured",
    },
  ];
}
