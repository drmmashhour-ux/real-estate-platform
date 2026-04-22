import { prisma } from "@/lib/db";

import type { MarketingGeneratedContentVm } from "./marketing.types";

/** Hard cap per UTC day — anti-spam (PART 12). */
export const MARKETING_MAX_POSTS_PER_DAY = 3;

function utcDayBounds(d: Date): { start: Date; next: Date } {
  const start = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  const next = new Date(start.getTime() + 86400000);
  return { start, next };
}

export async function countScheduledForUtcDay(day: Date): Promise<number> {
  const { start, next } = utcDayBounds(day);
  return prisma.lecipmMarketingHubPost.count({
    where: {
      scheduledAt: { gte: start, lt: next },
      status: { in: ["scheduled", "published"] },
    },
  });
}

export async function hasRecentDuplicate(
  vm: Pick<MarketingGeneratedContentVm, "contentType" | "sourceKind" | "sourceId">,
  windowDays = 7,
): Promise<boolean> {
  if (!vm.sourceId) return false;
  const since = new Date(Date.now() - windowDays * 86400000);
  const n = await prisma.lecipmMarketingHubPost.count({
    where: {
      contentType: vm.contentType,
      sourceKind: vm.sourceKind,
      sourceId: vm.sourceId,
      createdAt: { gte: since },
      status: { not: "cancelled" },
    },
  });
  return n > 0;
}

export async function createDraftFromGenerated(
  vm: MarketingGeneratedContentVm,
  opts?: { growthSignalRef?: string | null },
) {
  return prisma.lecipmMarketingHubPost.create({
    data: {
      contentType: vm.contentType,
      sourceKind: vm.sourceKind,
      sourceId: vm.sourceId,
      title: vm.title.slice(0, 500),
      caption: vm.caption,
      hashtagsJson: vm.hashtags,
      mediaRefsJson: vm.mediaRefs,
      suggestedPlatform: vm.suggestedPlatform,
      status: "pending_approval",
      growthSignalRef: opts?.growthSignalRef ?? undefined,
      manualExport: false,
    },
  });
}

export async function schedulePost(
  postId: string,
  when: Date,
  opts?: { skipDailyCap?: boolean },
): Promise<{ ok: boolean; reason?: string }> {
  if (!opts?.skipDailyCap) {
    const scheduledCount = await countScheduledForUtcDay(when);
    if (scheduledCount >= MARKETING_MAX_POSTS_PER_DAY) {
      return { ok: false, reason: "daily_cap" };
    }
  }

  await prisma.lecipmMarketingHubPost.update({
    where: { id: postId },
    data: {
      scheduledAt: when,
      status: "scheduled",
    },
  });
  return { ok: true };
}

/**
 * Generates up to 3 draft posts per day (types varied); does not publish without approval (PART 9).
 */
export async function autoScheduleDailyContent(): Promise<{ created: number; skipped: string[] }> {
  const skipped: string[] = [];
  let created = 0;

  const { generateTopFiveListingsPost, generateNewThisWeekPost, generateLuxurySpotlightPost } = await import(
    "./marketing-content.service"
  );

  const candidates: MarketingGeneratedContentVm[] = [];
  try {
    candidates.push(await generateTopFiveListingsPost());
  } catch (e) {
    skipped.push(`top5:${e instanceof Error ? e.message : "err"}`);
  }
  try {
    candidates.push(await generateNewThisWeekPost());
  } catch (e) {
    skipped.push(`new_week:${e instanceof Error ? e.message : "err"}`);
  }
  try {
    candidates.push(await generateLuxurySpotlightPost());
  } catch (e) {
    skipped.push(`luxury:${e instanceof Error ? e.message : "err"}`);
  }

  let n = 0;
  for (const vm of candidates) {
    if (n >= MARKETING_MAX_POSTS_PER_DAY) break;
    if (await hasRecentDuplicate(vm)) {
      skipped.push(`dup:${vm.contentType}`);
      continue;
    }
    await createDraftFromGenerated(vm);
    created += 1;
    n += 1;
  }

  return { created, skipped };
}
