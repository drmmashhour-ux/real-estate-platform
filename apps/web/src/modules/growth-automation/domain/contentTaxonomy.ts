import type { GrowthMarketingPlatform } from "@prisma/client";
import type { ContentFamily } from "@/src/modules/growth-automation/domain/growth-automation.types";

/** Structured LECIPM content pillars — all generated plans must map to these. */
export const CONTENT_PILLARS = ["mistake", "education", "decision", "demo", "story"] as const;
export type ContentPillar = (typeof CONTENT_PILLARS)[number];

export function isContentPillar(s: string): s is ContentPillar {
  return (CONTENT_PILLARS as readonly string[]).includes(s);
}

/** Map legacy API families to a single pillar (backwards compatible). */
export function contentFamilyToPillar(family: ContentFamily): ContentPillar {
  switch (family) {
    case "mistake_prevention":
      return "mistake";
    case "deal_education":
    case "legal_negotiation_explainer":
      return "education";
    case "comparison":
      return "decision";
    case "product_demo":
      return "demo";
    case "case_story":
      return "story";
    default:
      return "education";
  }
}

export function pillarToContentFamily(pillar: ContentPillar): ContentFamily {
  switch (pillar) {
    case "mistake":
      return "mistake_prevention";
    case "education":
      return "deal_education";
    case "decision":
      return "comparison";
    case "demo":
      return "product_demo";
    case "story":
      return "case_story";
  }
}

/**
 * Channel strategy: which pillars are allowed per platform (structured, not random).
 * Aligns with LECIPM channel positioning.
 */
export const CHANNEL_PILLAR_STRATEGY: Record<GrowthMarketingPlatform, readonly ContentPillar[]> = {
  TIKTOK: ["mistake", "demo"],
  YOUTUBE: ["education", "decision"],
  INSTAGRAM: ["mistake", "demo", "story", "education"],
  LINKEDIN: ["education", "decision", "story"],
  BLOG: ["education", "decision", "mistake", "story"],
  EMAIL: ["mistake", "education", "demo"],
};

export function allowedPillarsForPlatform(platform: GrowthMarketingPlatform): readonly ContentPillar[] {
  return CHANNEL_PILLAR_STRATEGY[platform];
}

export function isPillarAllowedOnPlatform(
  platform: GrowthMarketingPlatform,
  pillar: ContentPillar,
): boolean {
  return (allowedPillarsForPlatform(platform) as readonly string[]).includes(pillar);
}

/** Platform-specific content notes (for prompts and UI). */
export const CHANNEL_CONTENT_NOTES: Record<GrowthMarketingPlatform, string> = {
  TIKTOK: "Short hooks, mistake/demo angles, vertical pacing",
  YOUTUBE: "Education, decision frameworks, walkthrough-style sections",
  INSTAGRAM: "Reels-first, visual metaphor, on-screen text cues",
  LINKEDIN: "Professional insights, crisp paragraphs, credible tone",
  BLOG: "SEO headings, scannable sections, internal links",
  EMAIL: "Short actionable tips, one primary CTA",
};
