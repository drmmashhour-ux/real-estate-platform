import type { GrowthMarketingPlatform } from "@prisma/client";
import type { ContentPillar } from "@/src/modules/growth-automation/domain/contentTaxonomy";
import { CHANNEL_CONTENT_NOTES } from "@/src/modules/growth-automation/domain/contentTaxonomy";
import type { HookPattern } from "@/src/modules/growth-automation/domain/hookPatterns";

function clip(s: string, max: number): string {
  const t = s.trim();
  return t.length <= max ? t : `${t.slice(0, max - 1)}…`;
}

/**
 * Deterministic hook lines from pillar + pattern + platform (structure over randomness).
 * LLM layers may rewrite body; hooks stay within taxonomy patterns.
 */
export function generateStructuredHook(args: {
  pattern: HookPattern;
  pillar: ContentPillar;
  platform: GrowthMarketingPlatform;
  topicLine: string;
}): string {
  const topic = clip(args.topicLine, 72);
  const tone = CHANNEL_CONTENT_NOTES[args.platform];

  const templates: Record<HookPattern, (p: ContentPillar, t: string) => string> = {
    mistake: (pillar, t) => {
      if (pillar === "mistake")
        return `The ${t.slice(0, 40)} mistake most buyers repeat — and how to avoid it.`;
      return `Before you move forward: the hidden mistake in “${t.slice(0, 36)}”.`;
    },
    loss: (pillar, t) =>
      `What you risk losing if you ignore ${pillar} signals on ${t.slice(0, 40)}.`,
    curiosity: (pillar, t) =>
      `Why smart teams treat ${pillar} as non-negotiable on ${t.slice(0, 44)} — ${tone.split(",")[0]}.`,
    comparison: (pillar, t) =>
      `Bad move vs smart move: ${t.slice(0, 48)} (${pillar} lens).`,
    outcome: (pillar, t) =>
      `The outcome you want from ${t.slice(0, 44)} — framed for ${pillar} clarity.`,
  };

  let line = templates[args.pattern](args.pillar, topic);

  if (args.platform === "TIKTOK") line = clip(line, 120);
  if (args.platform === "LINKEDIN") line = clip(line, 220);
  if (args.platform === "EMAIL") line = clip(line, 90);

  return line;
}
