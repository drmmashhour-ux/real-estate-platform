import type { InvestorStoryBundle } from "@/modules/investor-story/investor-story.service";

export function buildOneMinuteNarrative(story: InvestorStoryBundle): string {
  return [
    "LECIPM combines BNHub short-term operations with residential brokerage workflows.",
    "Traction metrics below are pulled from production database snapshots — not marketing estimates.",
    story.growthNarrative.paragraphs[0] ?? story.growthNarrative.title,
  ].join(" ");
}
