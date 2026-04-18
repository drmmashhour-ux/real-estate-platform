import type { GtmSegment } from "./gtm.types";
import { generateGtmScript } from "./script-generator.service";

export type PitchOutline = {
  hook: string;
  problem: string;
  solution: string;
  proof: string;
  ask: string;
  compliance: string;
};

export function buildPitchOutline(segment: GtmSegment, market?: string): PitchOutline {
  const short = generateGtmScript({ segment, channel: "short_pitch", market });
  const long = generateGtmScript({ segment, channel: "long_pitch", market });

  return {
    hook: short.body.split("\n\n")[0] ?? short.body,
    problem: "Fragmented tools for STR + resale create compliance gaps and opaque fees.",
    solution: long.body.split("\n\n")[1] ?? long.body,
    proof: "Transparent fee configuration + Stripe + exportable investor metrics when enabled.",
    ask: "15-minute walkthrough — review-before-send on any outreach.",
    compliance: "No fabricated savings; competitor comparisons use your inputs only in ROI tools.",
  };
}
