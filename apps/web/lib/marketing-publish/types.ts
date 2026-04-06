import type {
  MarketingContentStatus,
  MarketingContentType,
  MarketingPublishChannel,
} from "@prisma/client";

export type MarketingPublishInput = {
  contentId: string;
  /** Plain text or HTML-safe body for social */
  bodyText: string;
  emailSubject: string | null;
  emailBody: string | null;
  emailCta: string | null;
  channel: MarketingPublishChannel;
  publishTargetId: string | null;
  contentType: MarketingContentType;
  /** Intended live send; providers may still force simulation if not configured */
  allowLive: boolean;
};

export type ProviderPublishResult = {
  ok: boolean;
  /** True when no real provider API was called */
  executedDryRun: boolean;
  externalPostId?: string | null;
  summary?: string | null;
  errorMessage?: string;
};

export type PublishMarketingContentParams = {
  contentId: string;
  channel?: MarketingPublishChannel;
  dryRun?: boolean;
  /** immediate: APPROVED or SCHEDULED ok; scheduled_due: only SCHEDULED past due */
  mode: "immediate" | "scheduled_due";
  /** Cron should pass true — skips items with publishDryRun=true */
  cronLiveOnly?: boolean;
};

export type PublishMarketingContentResult = {
  ok: boolean;
  code?: string;
  error?: string;
  jobId?: string;
  contentStatus?: MarketingContentStatus;
  executedDryRun?: boolean;
  summary?: string | null;
  externalPostId?: string | null;
};

export type MarketingPublishProvider = (
  input: MarketingPublishInput
) => Promise<ProviderPublishResult>;
