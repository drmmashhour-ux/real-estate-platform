import type { ContentSocialPlatform } from "@prisma/client";
import { prisma } from "@/lib/db";

/**
 * Pull latest metrics from provider or webhook payloads into `content_performance` snapshots.
 */
export async function recordPerformanceSnapshot(args: {
  socialPostId: string;
  platform: ContentSocialPlatform;
  metrics: {
    views?: number;
    likes?: number;
    comments?: number;
    shares?: number;
    clicks?: number;
    conversions?: number;
  };
}): Promise<void> {
  await prisma.contentPerformance.create({
    data: {
      socialPostId: args.socialPostId,
      platform: args.platform,
      views: args.metrics.views ?? 0,
      likes: args.metrics.likes ?? 0,
      comments: args.metrics.comments ?? 0,
      shares: args.metrics.shares ?? 0,
      clicks: args.metrics.clicks ?? 0,
      conversions: args.metrics.conversions ?? 0,
      pulledAt: new Date(),
    },
  });

  await prisma.contentSocialPost.update({
    where: { id: args.socialPostId },
    data: {
      analyticsJson: args.metrics as object,
    },
  });
}
