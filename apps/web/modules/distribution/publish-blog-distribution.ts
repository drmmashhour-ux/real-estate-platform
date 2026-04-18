/**
 * Distribution engine v1 — COPY MODE + share links only. No auto-post (user action required).
 * Uses marketing generator outputs as adapters (does not rewrite marketing-generator.service.ts).
 */
import { generateMarketingCopy, type MarketingGeneratorInput } from "@/modules/marketing/marketing-generator.service";
import type { MarketingBlogPost } from "@prisma/client";

export type BlogDistributionPack = {
  instagramCaption: string;
  instagramCaptionLong: string;
  /** COPY mode — Instagram has no generic “share this URL” for arbitrary text; paste in app or scheduler. */
  instagramPostingNote: string;
  facebookPost: string;
  linkedinPost: string;
  hashtags: string;
  shareLinks: {
    facebook: string;
    linkedin: string;
    x: string;
  };
};

function buildInput(city: string): MarketingGeneratorInput {
  return {
    target: "buyer",
    city: city || "Montréal",
    tone: "modern",
    objective: "browse_listings",
  };
}

/** Generate social copy from blog metadata — safe deterministic text; user edits before posting. */
export function publishBlogDistribution(
  post: Pick<MarketingBlogPost, "title" | "seoDescription" | "content" | "tags">,
  opts?: { publicUrl?: string; city?: string }
): BlogDistributionPack {
  const city = opts?.city ?? "Montréal";
  const input = buildInput(city);
  const pack = generateMarketingCopy(input);
  const short = pack.socialCaptions[0] ?? pack.descriptions[0] ?? post.title;
  const long = [post.title, "", post.seoDescription ?? "", "", post.content.slice(0, 1200)].join("\n").trim();
  const tags = (post.tags ?? []).map((t) => (t.startsWith("#") ? t : `#${t}`)).join(" ");
  const url = opts?.publicUrl ?? "";
  const baseHashtags = pack.hashtags.join(" ");

  const instagramCaption = `${post.title}\n\n${short.slice(0, 400)}${url ? `\n\n${url}` : ""}\n\n${tags || baseHashtags}`;
  const instagramCaptionLong = `${post.title}\n\n${long.slice(0, 1800)}${url ? `\n\n${url}` : ""}`;
  const facebookPost = `${post.title}\n\n${pack.descriptions[1] ?? short}${url ? `\n\n${url}` : ""}`;
  const linkedinPost = `${post.title}\n\nProfessional insight for ${city}: ${pack.descriptions[0] ?? short}${url ? `\n\nRead more: ${url}` : ""}`;

  const enc = encodeURIComponent(url || "https://lecipm.com");
  const titleEnc = encodeURIComponent(post.title);

  return {
    instagramCaption,
    instagramCaptionLong,
    instagramPostingNote:
      "Instagram: copy caption above — paste in the mobile app or Meta Business Suite. No auto-post in LECIPM v1.",
    facebookPost,
    linkedinPost,
    hashtags: tags || baseHashtags,
    shareLinks: {
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${enc}`,
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${enc}`,
      x: `https://twitter.com/intent/tweet?text=${titleEnc}&url=${enc}`,
    },
  };
}
