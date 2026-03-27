export const VIRAL_HOOK_KINDS = ["mistake", "loss", "curiosity", "comparison", "outcome"] as const;
export type ViralHookKind = (typeof VIRAL_HOOK_KINDS)[number];

export const VIRAL_CONTENT_TYPES = [
  "mistakes",
  "deal_breakdown",
  "demo",
  "before_after",
  "explanation",
] as const;
export type ViralContentType = (typeof VIRAL_CONTENT_TYPES)[number];

export const VIRAL_PLATFORMS = ["tiktok", "instagram_reels", "youtube_shorts"] as const;
export type ViralPlatform = (typeof VIRAL_PLATFORMS)[number];

export type ViralHookOption = {
  kind: ViralHookKind;
  text: string;
};

export type ShortVideoScript = {
  hook: string;
  body: string;
  demoIdea: string;
  cta: string;
};

export type PlatformAdaptedScript = ShortVideoScript & {
  platform: ViralPlatform;
  /** Extra line: hashtags, pacing, or platform-specific close */
  platformLine: string;
};
