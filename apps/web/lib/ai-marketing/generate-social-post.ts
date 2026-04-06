import { buildGenerationUserMessage } from "./build-generation-user-message";
import { marketingCompleteText } from "./completion";
import { THEME_PROMPT_SNIPPETS, normalizeTone, toneInstructions } from "./templates";
import type { ContentTheme, SocialPostInput, TextResult } from "./types";

function fallbackSocialPost(input: SocialPostInput): string {
  const theme: ContentTheme = input.theme ?? "platform_awareness";
  const hook =
    input.tone.toLowerCase().includes("viral")
      ? "Stop scrolling — this is how stays should feel on BNHub."
      : "Book curated stays with confidence on BNHub (LECIPM).";
  const body = [
    hook,
    "",
    `Topic: ${input.topic}.`,
    `For: ${input.audience}.`,
    THEME_PROMPT_SNIPPETS[theme].slice(0, 120) + "…",
    "",
    input.context?.trim() ? `Note: ${input.context.trim()}` : "Discover verified listings and host-ready tools.",
    "",
    `#BNHub #Stays #RealEstate`,
  ].join("\n");
  return body.slice(0, 2200);
}

/**
 * Short, platform-aware social post (organic marketing).
 */
export async function generateSocialPost(input: SocialPostInput): Promise<TextResult> {
  const theme: ContentTheme = input.theme ?? "platform_awareness";
  const tone = normalizeTone(input.tone);
  const system = `You write organic social posts for BNHub (short-term stays / hospitality) within LECIPM (real estate platform).
Rules:
- No invented statistics, user counts, revenue, or fake reviews.
- Keep it short and scannable for ${input.platform}.
- ${THEME_PROMPT_SNIPPETS[theme]}
- ${toneInstructions(tone)}
Output plain text only (no markdown fences).`;

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
            variantInstruction:
              "This is one of multiple A/B variants. Use a clearly different hook or angle from a generic repeat.",
          }
        : {}),
    },
    input.feedback
  );

  const ai = await marketingCompleteText({
    system,
    user,
    maxTokens: 550,
    temperature: 0.55,
  });

  if (ai) {
    return { text: ai.text.slice(0, 4000), source: ai.source };
  }

  return { text: fallbackSocialPost({ ...input, theme }), source: "fallback" };
}

/**
 * Generate 1–3 distinct social variants (sequential calls; different nudges per label).
 */
export async function generateSocialPostVariants(
  input: SocialPostInput,
  count: number
): Promise<TextResult[]> {
  const n = Math.min(Math.max(Math.floor(count), 1), 3);
  const out: TextResult[] = [];
  for (let i = 0; i < n; i++) {
    const label = String.fromCharCode(65 + i);
    const r = await generateSocialPost({
      ...input,
      variantLabel: label,
      variantOfTotal: n,
    });
    out.push(r);
  }
  return out;
}
