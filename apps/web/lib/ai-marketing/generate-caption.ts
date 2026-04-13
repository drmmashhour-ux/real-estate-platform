import { buildGenerationUserMessage } from "./build-generation-user-message";
import { marketingCompleteText } from "./completion";
import { THEME_PROMPT_SNIPPETS, normalizeTone, toneInstructions } from "./templates";
import type { CaptionInput, ContentTheme, TextResult } from "./types";

function fallbackCaption(input: CaptionInput): string {
  const theme: ContentTheme = input.theme ?? "bnhub_listings";
  const lines = [
    `✨ ${input.topic} — curated on BNHUB.`,
    `${THEME_PROMPT_SNIPPETS[theme].split(".")[0]}.`,
    input.context?.trim() ? `More: ${input.context.trim().slice(0, 120)}` : "Tap to explore stays.",
  ];
  return lines.join("\n").slice(0, 600);
}

/**
 * Very short caption / hook for reels, stories, or image posts.
 */
export async function generateCaption(input: CaptionInput): Promise<TextResult> {
  const theme: ContentTheme = input.theme ?? "bnhub_listings";
  const tone = normalizeTone(input.tone);
  const system = `You write ultra-short social captions for BNHUB (stays) / LECIPM.
Rules:
- 1–3 short lines; strong hook first.
- Fits ${input.platform} (character limits: be conservative).
- ${THEME_PROMPT_SNIPPETS[theme]}
- ${toneInstructions(tone)}
- No hashtags unless they truly help (max 3).
Plain text only.`;

  const user = buildGenerationUserMessage(
    {
      topic: input.topic,
      platform: input.platform,
      audience: input.audience,
      tone: input.tone,
      context: input.context ?? "",
      ...(input.variantLabel
        ? {
            variantLabel: input.variantLabel,
            variantOfTotal: input.variantOfTotal ?? 1,
            variantInstruction: "A/B variant: different hook than other variants.",
          }
        : {}),
    },
    input.feedback
  );

  const ai = await marketingCompleteText({
    system,
    user,
    maxTokens: 220,
    temperature: 0.6,
  });

  if (ai) {
    return { text: ai.text.slice(0, 1200), source: ai.source };
  }

  return { text: fallbackCaption({ ...input, theme }), source: "fallback" };
}

export async function generateCaptionVariants(input: CaptionInput, count: number): Promise<TextResult[]> {
  const n = Math.min(Math.max(Math.floor(count), 1), 3);
  const out: TextResult[] = [];
  for (let i = 0; i < n; i++) {
    const label = String.fromCharCode(65 + i);
    out.push(
      await generateCaption({
        ...input,
        variantLabel: label,
        variantOfTotal: n,
      })
    );
  }
  return out;
}
