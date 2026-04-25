/**
 * Channel plan for **visibility and adoption** — not unverifiable “dominance” claims.
 * Aligns with primary market focus and measurable leadership metrics.
 */

import { PRIMARY_MARKET, type PrimaryMarketConfig } from "@/modules/strategy/primary-market.config";

export type VisibilityChannel = "content" | "partnerships" | "events";

export type VisibilityInitiative = {
  id: string;
  channel: VisibilityChannel;
  title: string;
  description: string;
  /** Ties back to a segment; keeps focus single-market first */
  primaryMarket: boolean;
};

export function buildVisibilityPlan(config: PrimaryMarketConfig = PRIMARY_MARKET): VisibilityInitiative[] {
  const geo = config.primaryLabel;
  return [
    {
      id: "vis-c-1",
      channel: "content",
      title: "Proof-led stories in French + English",
      description: `Case-style content from ${geo}: measurable time saved, deals coordinated, and broker workflows — no “#1” or un sourced share claims.`,
      primaryMarket: true,
    },
    {
      id: "vis-c-2",
      channel: "content",
      title: "Category education",
      description:
        "Explain the LECIPM product category (AI-driven decision and brokerage intelligence) with transparent limits of AI assistance.",
      primaryMarket: true,
    },
    {
      id: "vis-p-1",
      channel: "partnerships",
      title: "Brokerage & board-adjacent collaboration",
      description: `Co-marketing and workshops with vetted ${geo} partners; contracts reviewed for claims compliance.`,
      primaryMarket: true,
    },
    {
      id: "vis-p-2",
      channel: "partnerships",
      title: "Product-led referral with attribution",
      description: "Trackable referral links and in-app success milestones — metrics feed the leadership dashboard.",
      primaryMarket: true,
    },
    {
      id: "vis-e-1",
      channel: "events",
      title: "In-market roundtables (small cohorts first)",
      description: "Invite-only sessions for high-intent teams; record feedback for product and enablement — scale only after Montréal repeatability.",
      primaryMarket: true,
    },
    {
      id: "vis-e-2",
      channel: "events",
      title: "Regional series (phase two)",
      description: `After primary thresholds: ${config.nextRegionLabel}-wide field events with the same compliance bar as ${geo}.`,
      primaryMarket: false,
    },
  ];
}
