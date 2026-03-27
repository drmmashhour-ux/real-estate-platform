import { upsertPerformance } from "@/src/modules/ai-growth-engine/infrastructure/growthRepository";
import type { PerformanceMetrics } from "@/src/modules/ai-growth-engine/domain/growth.types";

export async function trackPerformance(args: {
  itemId: string;
  snapshotDate: Date;
  metrics: PerformanceMetrics;
  raw?: Record<string, unknown>;
}) {
  return upsertPerformance({
    itemId: args.itemId,
    snapshotDate: args.snapshotDate,
    views: args.metrics.views,
    clicks: args.metrics.clicks,
    conversions: args.metrics.conversions,
    engagementScore: args.metrics.engagement,
    rawJson: args.raw,
  });
}
