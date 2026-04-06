/**
 * Automation hooks — structure only. Execution is gated (no auto-post without approval).
 *
 * TODO: Cron/worker: query SCHEDULED rows with scheduledAt <= now, then call publish/send stubs with audit log.
 * TODO: External analytics ingestion → `syncMarketingMetrics` to reconcile DB vs ad platforms.
 */

export type ScheduledContentPlaceholder = {
  scheduledAt?: string;
  draftId?: string;
};

export type AutoPostPlaceholder = {
  channelId?: string;
};

export type AnalyticsLoopPlaceholder = {
  batchId?: string;
};

/**
 * Future worker: load `MarketingContent` with status SCHEDULED and `scheduledAt` <= now,
 * enqueue publish/send jobs. **Not implemented** — DB rows are record-only until a worker exists.
 */
export async function runScheduledContent(_opts: { now?: Date } = {}): Promise<{
  processed: number;
  message: string;
}> {
  const now = _opts.now ?? new Date();
  void now;
  return {
    processed: 0,
    message:
      "No execution worker wired. Scheduling only updates rows; use explicit approval before any future auto-post.",
  };
}

/**
 * Placeholder: publish to a social channel after human approval (OAuth, encrypted tokens).
 * Prefer this name in new code; alias kept for compatibility.
 */
export async function publishMarketingContent(_contentId: string): Promise<void> {
  void _contentId;
}

/** @deprecated Use `publishMarketingContent` */
export async function postApprovedContentPlaceholder(contentId: string): Promise<void> {
  await publishMarketingContent(contentId);
}

/**
 * Placeholder: send a stored email campaign (e.g. Resend) with unsubscribe + template versioning.
 */
export async function sendMarketingEmailCampaign(_contentId: string): Promise<void> {
  void _contentId;
}

/** @deprecated Use `sendMarketingEmailCampaign` */
export async function sendEmailCampaignPlaceholder(contentId: string): Promise<void> {
  await sendMarketingEmailCampaign(contentId);
}

/**
 * Placeholder: pull impressions/clicks from ad APIs or analytics exports into `marketing_metrics` / rollups.
 */
export async function syncMarketingMetrics(_contentId?: string): Promise<{ synced: number }> {
  void _contentId;
  return { synced: 0 };
}
