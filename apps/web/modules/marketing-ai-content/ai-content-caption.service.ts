import type { AiCaptionPack, AiContentPlatform, AiShortFormScript, MarketingAiContentIdea } from "./ai-content.types";

const BASE_TAGS = ["lecipm", "realestate", "quebec", "canada"] as const;

function platformTags(platform: AiContentPlatform): string[] {
  if (platform === "TIKTOK") return ["fyp", "realtor", "homestaging", "montreal"];
  if (platform === "INSTAGRAM") return ["reels", "luxuryrealestate", "montrealliving", "investing"];
  return ["realestateinvesting", "housingmarket", "shorts"];
}

function cleanHashtags(tags: string[], max = 12): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const t of tags) {
    const n = t
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9_]/g, "");
    if (!n || seen.has(n)) continue;
    seen.add(n);
    out.push(`#${n}`);
    if (out.length >= max) break;
  }
  return out;
}

/**
 * Captions + hashtags + CTA line from a script (and idea for city-specific tags).
 */
export function generateCaptionPack(
  idea: MarketingAiContentIdea,
  platform: AiContentPlatform,
  script: AiShortFormScript
): AiCaptionPack {
  const citySlug = idea.city
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/[^a-z0-9]+/g, "");

  const line1 = script.hook;
  const line2 = script.body.split(/(?<=[.?!])\s+/).slice(0, 2).join(" ");
  const ctaLine = script.cta;

  const caption =
    platform === "YOUTUBE"
      ? `${line1}\n\n${line2}\n\n${ctaLine}\n\n—\nNot financial or legal advice; for research only.`
      : `${line1}\n\n${line2}\n\n${ctaLine}`;

  const tagPool = [
    ...BASE_TAGS,
    citySlug || "montreal",
    ...platformTags(platform),
    idea.formatHint === "short_video" ? "dayinmylife" : "realestatetips",
  ];

  return {
    ideaId: idea.id,
    platform,
    caption: caption.slice(0, 2200),
    hashtags: cleanHashtags(tagPool),
    ctaLine,
  };
}

export function packToSocialText(pack: AiCaptionPack): string {
  return `${pack.caption}\n\n${pack.hashtags.join(" ")}`.trim();
}
