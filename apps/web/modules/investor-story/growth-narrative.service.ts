import type { ScalingGrowthBundle } from "@/modules/scaling-growth/scaling-growth.service";

export type GrowthNarrative = {
  title: string;
  paragraphs: string[];
  risks: string[];
};

/** Explains scaling bundle — highlights data gaps rather than inventing growth. */
export function buildGrowthNarrativeFromScaling(bundle: ScalingGrowthBundle): GrowthNarrative {
  const ch = bundle.channels.bestChannelBySignups;
  const paragraphs: string[] = [
    `Channel mix (90d) is summarized from signup attribution JSON — best attributed channel: ${ch ?? "none detected"}.`,
    `Weekly signup cohorts show ${bundle.cohorts.rows.filter((r) => r.signups > 0).length} non-empty weeks in the window.`,
    `Retention inventory: ${bundle.retention.guestsWithTwoPlusBookings} guests with 2+ bookings; ${bundle.retention.hostsWithTwoPlusListings} hosts with 2+ listings.`,
  ];

  return {
    title: "Growth mechanics (internal signals)",
    paragraphs,
    risks: [
      "Attribution gaps understate social/organic performance.",
      "Funnel steps require event instrumentation to be board-grade.",
    ],
  };
}
