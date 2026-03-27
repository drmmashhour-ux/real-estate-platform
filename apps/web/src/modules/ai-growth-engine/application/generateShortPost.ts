import type { ShortPost } from "@/src/modules/ai-growth-engine/domain/growth.types";
import { growthJsonCompletion } from "@/src/modules/ai-growth-engine/infrastructure/growthLlm";

const SYSTEM = `Write concise social copy. No spam. No guaranteed outcomes. 1 CTA. JSON only: { "text", "hashtags": string[], "cta" }. Max 3 hashtags.`;

export async function generateShortPost(args: { topic: string; tone?: string }): Promise<ShortPost> {
  const out = await growthJsonCompletion<ShortPost>({
    system: SYSTEM,
    user: `Topic: ${args.topic}. Tone: ${args.tone ?? "professional, friendly"}.`,
  });
  if (!out.ok) {
    return {
      text: `${args.topic} — short overview for education only. Not advice; verify with a licensed professional.`,
      hashtags: ["RealEstate", "Quebec", "LECIPM"],
      cta: "Learn more on the platform.",
    };
  }
  return {
    ...out.data,
    hashtags: (out.data.hashtags ?? []).slice(0, 3),
  };
}
