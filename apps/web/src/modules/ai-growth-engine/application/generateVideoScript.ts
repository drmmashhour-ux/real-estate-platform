import type { VideoScript } from "@/src/modules/ai-growth-engine/domain/growth.types";
import { growthJsonCompletion } from "@/src/modules/ai-growth-engine/infrastructure/growthLlm";

const SYSTEM = `You write short educational video scripts for a real estate platform. Simple words. Strong hook in first 5 seconds. Clear CTA. No legal advice; say "consult a licensed professional" where needed. JSON only.`;

export async function generateVideoScript(args: { topic: string; audience?: string; durationSec?: number }): Promise<VideoScript> {
  const user = JSON.stringify({
    topic: args.topic,
    audience: args.audience ?? "sellers and buyers in Quebec",
    targetDurationSec: args.durationSec ?? 60,
  });

  const out = await growthJsonCompletion<VideoScript>({
    system: SYSTEM,
    user: `Return JSON matching: { "title", "hook", "outline": string[], "script", "cta", "durationHintSec": number }. ${user}`,
  });

  if (!out.ok) {
    return {
      title: args.topic,
      hook: "Here is one thing worth knowing before your next step.",
      outline: ["Context", "Main point", "What to do next"],
      script:
        "Hook: quick fact. Body: plain-language explanation—overview only, not advice. Close: consult a licensed professional for your situation.",
      cta: "Save this checklist and verify details with a pro.",
      durationHintSec: args.durationSec ?? 60,
    };
  }
  return out.data;
}
