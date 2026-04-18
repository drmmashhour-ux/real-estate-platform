import { listCompetitorProfiles } from "./competitor-analysis.service";
import { buildDifferentiationMatrix } from "./differentiation-engine";
import { buildMessagingAngles } from "./messaging-generator.service";
import type { CompetitorId } from "./competitor-analysis.service";

export type PositioningBundle = {
  generatedAt: string;
  competitors: ReturnType<typeof listCompetitorProfiles>;
  focus: CompetitorId;
  differentiation: ReturnType<typeof buildDifferentiationMatrix>;
  messaging: ReturnType<typeof buildMessagingAngles>;
  disclaimers: string[];
};

export function buildPositioningBundle(focus: CompetitorId = "airbnb"): PositioningBundle {
  return {
    generatedAt: new Date().toISOString(),
    competitors: listCompetitorProfiles(),
    focus,
    differentiation: buildDifferentiationMatrix(focus),
    messaging: buildMessagingAngles(focus),
    disclaimers: [
      "Positioning statements are strategic framing — validate with legal/comms before external use.",
      "No competitor market-share percentages are asserted here.",
    ],
  };
}
