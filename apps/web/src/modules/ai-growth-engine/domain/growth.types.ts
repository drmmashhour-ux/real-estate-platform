/** Social / content surfaces — use platform policies before publishing. */
export type GrowthPlatform =
  | "tiktok"
  | "youtube"
  | "instagram"
  | "linkedin"
  | "blog"
  | "email"
  | "x";

export type GrowthContentKind = "video_script" | "short_post" | "blog" | "email" | "thumbnail_copy";

export type DailyContentPlanSlot = {
  topic: string;
  contentType: GrowthContentKind;
  platforms: GrowthPlatform[];
  hooks: string[];
  notes?: string;
};

export type DailyContentPlan = {
  id: string;
  planDate: string; // ISO date
  brandVoice: string;
  slots: DailyContentPlanSlot[];
  complianceFooter: string;
};

export type VideoScript = {
  title: string;
  hook: string;
  outline: string[];
  script: string;
  cta: string;
  durationHintSec: number;
};

export type ShortPost = {
  text: string;
  hashtags: string[];
  cta: string;
};

export type BlogPost = {
  title: string;
  slugSuggestion: string;
  excerpt: string;
  sections: { heading: string; body: string }[];
  cta: string;
  metaDescription: string;
};

export type EmailContent = {
  subject: string;
  preheader: string;
  bodyMarkdown: string;
  ctaLabel: string;
  ctaUrlPlaceholder: string;
};

export type PlatformAdaptation = {
  platform: GrowthPlatform;
  body: string;
  extras?: Record<string, string>;
};

export type ScheduledItem = {
  itemId: string;
  platform: GrowthPlatform;
  scheduledAt: string; // ISO
  timezone: string;
};

export type PublishResult =
  | { status: "queued"; externalId?: string; message: string }
  | { status: "skipped"; reason: string }
  | { status: "failed"; error: string };

export type PerformanceMetrics = {
  views: number;
  clicks: number;
  conversions: number;
  engagement: number;
};

export type ContentStrategyHints = {
  emphasizeTopics: string[];
  avoidTopics: string[];
  preferredFormats: GrowthContentKind[];
  rationale: string;
};
