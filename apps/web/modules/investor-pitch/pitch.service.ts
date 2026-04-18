import type { CompetitorId } from "@/modules/positioning/competitor-analysis.service";
import { buildInvestorStoryBundle } from "@/modules/investor-story/investor-story.service";
import { buildPositioningBundle } from "@/modules/positioning/positioning.service";
import { generateInvestorSlideDeck } from "./slide-generator.service";
import { buildOneMinuteNarrative } from "./narrative.service";

export async function buildFullInvestorPitchPackage(focusCompetitor: CompetitorId = "airbnb") {
  const story = await buildInvestorStoryBundle();
  const positioning = buildPositioningBundle(focusCompetitor);
  const deck = generateInvestorSlideDeck(story, positioning);
  const narrative = buildOneMinuteNarrative(story);
  return {
    generatedAt: new Date().toISOString(),
    deck,
    narrative,
    story,
    positioning,
  };
}
