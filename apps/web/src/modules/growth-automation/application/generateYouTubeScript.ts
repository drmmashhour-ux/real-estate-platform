import { growthAutomationJsonCompletion } from "@/src/modules/growth-automation/infrastructure/growthAutomationLlm";
import type { ContentFamily } from "@/src/modules/growth-automation/domain/growth-automation.types";

export type YouTubeScript = {
  title: string;
  description: string;
  sections: Array<{ heading: string; script: string }>;
  cta: string;
  suggestedTags: string[];
};

export async function generateYouTubeScript(args: {
  topic: string;
  contentFamily: ContentFamily;
  productOrFeature: string;
}): Promise<YouTubeScript> {
  const res = await growthAutomationJsonCompletion<YouTubeScript>({
    system: "Long-form YouTube outline for LECIPM. JSON only. Educational, Quebec context, no guaranteed outcomes.",
    user: JSON.stringify(args),
    label: "youtube_script",
  });
  if (!res.ok) {
    return {
      title: `${args.topic} | LECIPM`,
      description: `Walkthrough of ${args.topic} and how ${args.productOrFeature} fits your process.`,
      sections: [
        { heading: "Intro", script: "Hook + what you will learn." },
        { heading: "Body", script: "Framework + example." },
        { heading: "Outro", script: "CTA to try LECIPM." },
      ],
      cta: "Subscribe and book a workspace tour.",
      suggestedTags: ["real estate", "Quebec", "LECIPM"],
    };
  }
  return res.data;
}
