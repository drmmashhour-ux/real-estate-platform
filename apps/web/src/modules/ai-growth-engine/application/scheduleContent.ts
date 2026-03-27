import {
  MAX_SCHEDULED_POSTS_PER_DAY,
  MIN_MINUTES_BETWEEN_SAME_PLATFORM,
} from "@/src/modules/ai-growth-engine/domain/growth.policies";
import type { GrowthPlatform, ScheduledItem } from "@/src/modules/ai-growth-engine/domain/growth.types";

/**
 * Produces ISO schedule times starting at `start`, spacing per platform.
 * Enforces daily cap and minimum gap (anti-spam pacing).
 */
export function scheduleContent(args: {
  items: { itemId: string; platform: GrowthPlatform }[];
  start: Date;
  timezone: string;
}): ScheduledItem[] {
  const byPlatform: Partial<Record<GrowthPlatform, Date>> = {};
  const out: ScheduledItem[] = [];
  let cursor = new Date(args.start);
  let count = 0;

  for (const item of args.items) {
    if (count >= MAX_SCHEDULED_POSTS_PER_DAY) break;
    const last = byPlatform[item.platform];
    const next = new Date(cursor);
    if (last) {
      const minNext = new Date(last.getTime() + MIN_MINUTES_BETWEEN_SAME_PLATFORM * 60_000);
      if (next < minNext) next.setTime(minNext.getTime());
    }
    byPlatform[item.platform] = next;
    out.push({
      itemId: item.itemId,
      platform: item.platform,
      scheduledAt: next.toISOString(),
      timezone: args.timezone,
    });
    cursor = new Date(next.getTime() + 30 * 60_000);
    count++;
  }
  return out;
}
