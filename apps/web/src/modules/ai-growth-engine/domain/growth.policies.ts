import type { GrowthPlatform } from "@/src/modules/ai-growth-engine/domain/growth.types";

/** Hard cap on scheduled posts per day per brand (anti-spam). */
export const MAX_SCHEDULED_POSTS_PER_DAY = 12;

/** Minimum minutes between posts on the same platform (rate pacing). */
export const MIN_MINUTES_BETWEEN_SAME_PLATFORM = 90;

export const COMPLIANCE_FOOTER_LECIPM =
  "Educational content only — not legal, tax, or investment advice. Past performance does not guarantee future results. Quebec real estate rules may apply; verify with a licensed professional.";

export function platformPostingRules(platform: GrowthPlatform): string {
  const rules: Record<GrowthPlatform, string> = {
    tiktok: "Short, authentic, no misleading claims; disclose partnerships; follow TikTok Community Guidelines.",
    youtube: "Accurate titles; no clickbait on regulated claims; disclose material connections.",
    instagram: "Use captions truthfully; #ad when sponsored; respect Instagram commerce policies.",
    linkedin: "Professional tone; no spam or automated bulk messaging; comply with LinkedIn Professional Community Policies.",
    blog: "SEO content must be accurate; include last-updated when material facts change.",
    email: "CAN-SPAM / CASL-style: include unsubscribe path in production; this draft is internal until reviewed.",
    x: "Concise; no harassment; follow X Rules.",
  };
  return rules[platform];
}

export function isPublishAllowed(args: {
  humanApprovedAt: Date | null;
  status: string;
}): boolean {
  return args.status === "approved" && args.humanApprovedAt != null;
}
