import { buildInvestorStoryBundle } from "@/modules/investor-story/investor-story.service";
import { buildPositioningBundle } from "@/modules/positioning/positioning.service";
import { buildLaunchInvestorExport, type ExportKind } from "./metrics-export.service";
import { generatePitchDeckOutline } from "./pitch-deck.generator";

export type WeeklyInvestorUpdate = {
  generatedAt: string;
  story: Awaited<ReturnType<typeof buildInvestorStoryBundle>>;
  positioning: ReturnType<typeof buildPositioningBundle>;
  pitchOutline: ReturnType<typeof generatePitchDeckOutline>;
};

export async function buildWeeklyInvestorUpdate(): Promise<WeeklyInvestorUpdate> {
  const story = await buildInvestorStoryBundle();
  const positioning = buildPositioningBundle("airbnb");
  const pitchOutline = generatePitchDeckOutline(story, positioning);
  return {
    generatedAt: new Date().toISOString(),
    story,
    positioning,
    pitchOutline,
  };
}

export { buildLaunchInvestorExport, type ExportKind };
