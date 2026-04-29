import { openai, isOpenAiConfigured } from "@/lib/ai/openai";
import { CAPTION_SYSTEM_PROMPT } from "@/lib/listings/caption-prompt";
import type { CaptionSafeInput } from "@/lib/listings/caption-input";
import { generateTemplateCaption } from "@/lib/listings/caption-template";

function captionsFeatureEnabled(): boolean {
  return process.env.AI_CAPTIONS_ENABLED === "true";
}

function maxCaptionTokens(): number {
  const n = Number.parseInt(process.env.AI_CAPTIONS_MAX_TOKENS ?? "300", 10);
  return Number.isFinite(n) && n > 32 ? Math.min(1024, n) : 300;
}

function captionsModel(): string {
  return process.env.AI_CAPTIONS_MODEL?.trim() || "gpt-4o-mini";
}

export type GenerateCaptionResult = {
  caption: string;
  source: "ai" | "template";
};

/**
 * Generates listing description copy — template fallback when AI disabled or unavailable.
 * Never sends images; text-only JSON payload.
 */
export async function generateCaption(input: CaptionSafeInput): Promise<GenerateCaptionResult> {
  const fallback = generateTemplateCaption(input);

  if (!captionsFeatureEnabled()) {
    return { caption: fallback, source: "template" };
  }

  const provider = (process.env.AI_PROVIDER ?? "openai").toLowerCase();
  if (provider !== "openai") {
    return { caption: fallback, source: "template" };
  }

  if (!openai || !isOpenAiConfigured()) {
    return { caption: fallback, source: "template" };
  }

  try {
    const completion = await openai.chat.completions.create({
      model: captionsModel(),
      temperature: 0.35,
      max_tokens: maxCaptionTokens(),
      messages: [
        { role: "system", content: CAPTION_SYSTEM_PROMPT },
        {
          role: "user",
          content: `Facts JSON (use only these):\n${JSON.stringify(input)}`,
        },
      ],
    });
    const text = completion.choices[0]?.message?.content?.trim();
    if (!text || text.length < 80) {
      return { caption: fallback, source: "template" };
    }
    return { caption: text, source: "ai" };
  } catch {
    return { caption: fallback, source: "template" };
  }
}
