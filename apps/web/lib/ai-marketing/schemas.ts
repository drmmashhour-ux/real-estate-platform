import { z } from "zod";

export const contentThemeSchema = z.enum([
  "bnhub_listings",
  "travel_inspiration",
  "re_investment",
  "platform_awareness",
  "trust_reviews",
]);

/** Shared persistence + feedback fields for generation POST bodies */
const feedbackAndSaveFields = {
  pastPerformance: z.string().max(8000).optional(),
  bestThemes: z.array(contentThemeSchema).max(10).optional(),
  channelNotes: z.string().max(4000).optional(),
  priorHighPerformingExamples: z.string().max(8000).optional(),
  /** Skip DB-backed analytics hints in prompts */
  skipAnalyticsHints: z.boolean().optional(),
  /** Legacy name — saves a draft row when true */
  saveDraft: z.boolean().optional(),
  /** Alias for saveDraft — either may be set */
  save: z.boolean().optional(),
  /** A/B: generate 1–3 variants; parent row = A, children B/C */
  variantCount: z.number().int().min(1).max(3).optional(),
};

export const socialPostBodySchema = z.object({
  topic: z.string().max(2000).optional(),
  platform: z.string().max(200).optional(),
  tone: z.string().max(100).optional(),
  audience: z.string().max(500).optional(),
  context: z.string().max(4000).optional(),
  theme: contentThemeSchema.optional(),
  ...feedbackAndSaveFields,
});

export const captionBodySchema = socialPostBodySchema;

export const emailBodySchema = z.object({
  topic: z.string().max(2000).optional(),
  tone: z.string().max(100).optional(),
  audience: z.string().max(500).optional(),
  context: z.string().max(4000).optional(),
  emailKind: z.enum(["partnership", "onboarding", "promotional"]).optional(),
  partnerType: z.string().max(200).optional(),
  ...feedbackAndSaveFields,
  isEmailCampaign: z.boolean().optional(),
});

export const growthIdeasBodySchema = z.object({
  topic: z.string().max(2000).optional(),
  audience: z.string().max(500).optional(),
  tone: z.string().max(100).optional(),
  context: z.string().max(4000).optional(),
  stage: z.enum(["pre_launch", "early", "growth"]).optional(),
  ...feedbackAndSaveFields,
});

export const scheduleBodySchema = z.object({
  contentId: z.string().min(1).max(128),
  scheduledAt: z.string().min(1),
});

export const marketingTrackBodySchema = z
  .object({
    contentId: z.string().min(1).max(128),
    views: z.number().int().nonnegative().optional(),
    clicks: z.number().int().nonnegative().optional(),
    conversions: z.number().int().nonnegative().optional(),
    opens: z.number().int().nonnegative().optional(),
    notes: z.string().max(8000).optional(),
  })
  .refine(
    (d) =>
      d.views != null ||
      d.clicks != null ||
      d.conversions != null ||
      d.opens != null ||
      (d.notes != null && d.notes.trim().length > 0),
    { message: "Provide at least one of views, clicks, conversions, opens, or notes" }
  );

export const marketingPublishChannelSchema = z.enum(["EMAIL", "X", "LINKEDIN", "INSTAGRAM", "TIKTOK"]);

export const marketingContentPatchSchema = z.object({
  status: z
    .enum([
      "DRAFT",
      "APPROVED",
      "SCHEDULED",
      "PUBLISHED",
      "PUBLISHING",
      "FAILED",
    ])
    .optional(),
  /** Clear `scheduled_at` without using the schedule endpoint (e.g. mistake). Setting a publish time: `POST /api/marketing/schedule` only. */
  clearScheduledAt: z.boolean().optional(),
  isEmailCampaign: z.boolean().optional(),
  content: z.string().max(50000).optional(),
  topic: z.union([z.string().max(2000), z.null()]).optional(),
  tone: z.union([z.string().max(200), z.null()]).optional(),
  audience: z.union([z.string().max(500), z.null()]).optional(),
  platform: z.union([z.string().max(200), z.null()]).optional(),
  theme: z.union([z.string().max(128), z.null()]).optional(),
  emailSubject: z.union([z.string().max(300), z.null()]).optional(),
  emailBody: z.union([z.string().max(50000), z.null()]).optional(),
  emailCta: z.union([z.string().max(500), z.null()]).optional(),
  publishChannel: z.union([marketingPublishChannelSchema, z.null()]).optional(),
  publishTargetId: z.union([z.string().max(500), z.null()]).optional(),
  publishDryRun: z.boolean().optional(),
});

export const marketingPublishBodySchema = z.object({
  contentId: z.string().min(1).max(128),
  channel: marketingPublishChannelSchema.optional(),
  dryRun: z.boolean().optional(),
});

export const marketingRunScheduledBodySchema = z.object({
  limit: z.number().int().min(1).max(50).optional(),
  /** When true, same as Vercel cron — only live-intent rows (publishDryRun=false) */
  cronLiveOnly: z.boolean().optional(),
});

export const marketingVariantWinnerBodySchema = z.object({
  parentContentId: z.string().min(1).max(128),
  winningContentId: z.string().min(1).max(128),
});
