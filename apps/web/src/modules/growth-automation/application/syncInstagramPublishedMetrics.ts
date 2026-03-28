import { fetchInstagramMediaEngagement } from "@/src/modules/growth-automation/adapters/instagramAdapter";
import { ensureFreshAccessToken } from "@/src/modules/growth-automation/infrastructure/channelTokens";
import {
  listPublishedInstagramWithExternalId,
  upsertPerformanceMetric,
} from "@/src/modules/growth-automation/infrastructure/growthAutomationRepository";

/**
 * Pulls like/comment counts for recently published Instagram growth items and stores daily snapshots.
 */
export async function syncInstagramPublishedMetrics(options?: { take?: number }): Promise<{
  ok: boolean;
  processed: number;
  errors: number;
}> {
  const take = options?.take ?? 50;
  const items = await listPublishedInstagramWithExternalId(take);
  const metricDate = new Date().toISOString().slice(0, 10);
  let errors = 0;
  let processed = 0;

  for (const item of items) {
    if (!item.externalPostId || !item.marketingChannelId) continue;
    try {
      const tokens = await ensureFreshAccessToken(item.marketingChannelId);
      if (!tokens?.accessToken) {
        errors += 1;
        continue;
      }
      const stats = await fetchInstagramMediaEngagement({
        mediaId: item.externalPostId,
        accessToken: tokens.accessToken,
      });
      if (!stats) {
        errors += 1;
        continue;
      }
      await upsertPerformanceMetric({
        contentItemId: item.id,
        platform: "INSTAGRAM",
        metricDate,
        views: 0,
        likes: stats.likes,
        comments: stats.comments,
      });
      processed += 1;
    } catch (e) {
      errors += 1;
      console.warn("[syncInstagramPublishedMetrics]", item.id, e);
    }
  }

  return { ok: true, processed, errors };
}
