import { growthAutomationJsonCompletion } from "@/src/modules/growth-automation/infrastructure/growthAutomationLlm";

export type StoryboardScene = { scene: number; visual: string; voiceover: string; durationSec: number };

export async function generateStoryboard(args: { scriptSummary: string; format: "short" | "long" }) {
  const res = await growthAutomationJsonCompletion<{ scenes: StoryboardScene[] }>({
    system: "Create a simple storyboard JSON. No copyrighted characters.",
    user: JSON.stringify(args),
    label: "storyboard",
  });
  if (!res.ok) {
    return {
      scenes: [
        { scene: 1, visual: "Hook title card", voiceover: args.scriptSummary.slice(0, 120), durationSec: 3 },
        { scene: 2, visual: "Product UI hint", voiceover: "Show workflow", durationSec: 8 },
      ],
    };
  }
  return res.data;
}
