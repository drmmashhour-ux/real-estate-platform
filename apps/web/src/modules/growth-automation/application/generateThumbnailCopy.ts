import { growthAutomationJsonCompletion } from "@/src/modules/growth-automation/infrastructure/growthAutomationLlm";

export type ThumbnailCopy = {
  primaryText: string;
  secondaryText?: string;
  contrastNote: string;
};

export async function generateThumbnailCopy(args: { topic: string; channel: string }): Promise<ThumbnailCopy> {
  const res = await growthAutomationJsonCompletion<ThumbnailCopy>({
    system: "You write 2–5 word thumbnail headlines. JSON only.",
    user: JSON.stringify(args),
    label: "thumbnail",
  });
  if (!res.ok) {
    return {
      primaryText: args.topic.slice(0, 28),
      secondaryText: "LECIPM",
      contrastNote: "Light text on dark background",
    };
  }
  return res.data;
}
