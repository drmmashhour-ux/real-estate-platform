import { growthAutomationJsonCompletion } from "@/src/modules/growth-automation/infrastructure/growthAutomationLlm";
import type { ContentFamily } from "@/src/modules/growth-automation/domain/growth-automation.types";

export type ShortVideoScript = {
  hook: string;
  beats: string[];
  onScreenText: string[];
  cta: string;
  durationSecondsEstimate: number;
};

export async function generateShortVideoScript(args: {
  topic: string;
  contentFamily: ContentFamily;
  productOrFeature: string;
}): Promise<ShortVideoScript> {
  const res = await growthAutomationJsonCompletion<ShortVideoScript>({
    system: "Short vertical video script for LECIPM. JSON only. 15–45s. No medical/legal advice; educational tone.",
    user: JSON.stringify(args),
    label: "short_video",
  });
  if (!res.ok) {
    return {
      hook: args.topic,
      beats: ["Problem", "Reframe", "How LECIPM helps", "CTA"],
      onScreenText: [args.topic, "One workspace", "LECIPM"],
      cta: "Link in bio — see the workflow.",
      durationSecondsEstimate: 30,
    };
  }
  return res.data;
}
