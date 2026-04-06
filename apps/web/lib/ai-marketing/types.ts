/**
 * BNHub / LECIPM AI marketing — shared types.
 */

export type ContentTheme =
  | "bnhub_listings"
  | "travel_inspiration"
  | "re_investment"
  | "platform_awareness"
  | "trust_reviews";

export type ToneId =
  | "professional"
  | "viral"
  | "emotional"
  | "playful"
  | "urgent";

export type EmailKind = "partnership" | "onboarding" | "promotional";

export type AiSource = "openai" | "fallback";

/**
 * Optional context for a light feedback loop (future analytics can populate these fields).
 */
export type GenerationFeedbackInput = {
  pastPerformance?: string;
  bestThemes?: ContentTheme[];
  /** Channel-specific notes (e.g. “TikTok: hooks in 1s”, “LinkedIn: no hashtags”). */
  channelNotes?: string;
  /** Free text: paste high-performing copy snippets or describe what resonated. */
  priorHighPerformingExamples?: string;
};

export type SocialPostInput = {
  topic: string;
  platform: string;
  tone: string;
  audience: string;
  /** Extra product or campaign context */
  context?: string;
  theme?: ContentTheme;
  feedback?: GenerationFeedbackInput;
  /** A/B generation: label and total variant count */
  variantLabel?: string;
  variantOfTotal?: number;
};

export type CaptionInput = {
  topic: string;
  platform: string;
  tone: string;
  audience: string;
  context?: string;
  theme?: ContentTheme;
  feedback?: GenerationFeedbackInput;
  variantLabel?: string;
  variantOfTotal?: number;
};

export type EmailInput = {
  topic: string;
  tone: string;
  audience: string;
  context?: string;
  emailKind: EmailKind;
  /** e.g. insurance broker, local café — for partnership emails */
  partnerType?: string;
  feedback?: GenerationFeedbackInput;
  variantLabel?: string;
  variantOfTotal?: number;
};

export type GrowthIdeasInput = {
  topic: string;
  audience: string;
  tone?: string;
  context?: string;
  /** Rough stage for more relevant tactics */
  stage?: "pre_launch" | "early" | "growth";
  feedback?: GenerationFeedbackInput;
  variantLabel?: string;
  variantOfTotal?: number;
};

export type TextResult = { text: string; source: AiSource };

export type EmailResult = {
  subject: string;
  body: string;
  cta: string;
  source: AiSource;
};

export type GrowthIdeasResult = {
  ideas: string[];
  source: AiSource;
};
