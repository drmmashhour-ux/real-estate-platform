/**
 * AI Content + video generation (structured templates, deterministic for tests;
 * can later swap bodies for an LLM without changing the surface API).
 */

export type AiContentPlatform = "TIKTOK" | "INSTAGRAM" | "YOUTUBE";

export type AiContentAudience = "broker" | "investor" | "buyer";

export type AiContentGoal = "leads" | "awareness" | "conversion";

export type MarketingAiContentIdea = {
  id: string;
  title: string;
  /** Suggested primary angle for scripts */
  angle: string;
  /** Optional vertical hint */
  formatHint: "short_video" | "carousel" | "talking_head";
  city: string;
};

export type AiShortFormScript = {
  ideaId: string;
  platform: AiContentPlatform;
  hook: string;
  body: string;
  cta: string;
  /** Reading-time hint in seconds (15–60 typical) */
  targetSeconds: number;
  onScreenText: string[];
};

export type AiCaptionPack = {
  ideaId: string;
  platform: AiContentPlatform;
  caption: string;
  hashtags: string[];
  ctaLine: string;
};

export type AiDailyContentKind = "video" | "image";

export type AiDailyPost = {
  id: string;
  dateIso: string;
  kind: AiDailyContentKind;
  platform: AiContentPlatform;
  idea: MarketingAiContentIdea;
  script: AiShortFormScript;
  captions: AiCaptionPack;
  /** Suggested time label for calendar */
  slot: "morning" | "midday" | "evening";
};

export type AiDailyContentPlan = {
  id: string;
  anchorDate: string;
  city: string;
  posts: AiDailyPost[];
  generatedAtIso: string;
};
