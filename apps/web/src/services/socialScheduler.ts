import { randomUUID } from "crypto";
import { prisma } from "@/lib/db";
import type { Prisma } from "@prisma/client";
import { logError } from "@/lib/logger";

export type SocialPlatform = "linkedin" | "instagram" | "x";

const PLATFORMS = new Set<string>(["linkedin", "instagram", "x"]);

type SocialDelegate = {
  create: (args: {
    data: {
      platform: string;
      content: Prisma.InputJsonValue;
      scheduledAt: Date;
      status: string;
      createdByUserId: string | null;
    };
  }) => Promise<{ id: string }>;
  findMany: (args: object) => Promise<{ id: string; platform: string; content: unknown }[]>;
  update: (args: object) => Promise<unknown>;
};

function socialTable(): SocialDelegate | null {
  const d = prisma as unknown as { socialScheduledPost?: SocialDelegate };
  return d.socialScheduledPost ?? null;
}

/**
 * Queue a post for later publishing (cron or manual `postNow` sweep).
 */
export async function schedulePost(
  platform: SocialPlatform,
  content: { text: string; url?: string },
  scheduledAt: Date,
  createdByUserId?: string | null
): Promise<{ id: string }> {
  if (!PLATFORMS.has(platform)) {
    throw new Error(`Unsupported platform: ${platform}`);
  }
  const table = socialTable();
  if (!table) {
    return { id: `social-stub-${randomUUID()}` };
  }
  const row = await table.create({
    data: {
      platform,
      content: content as unknown as Prisma.InputJsonValue,
      scheduledAt,
      status: "pending",
      createdByUserId: createdByUserId ?? null,
    },
  });
  return { id: row.id };
}

/**
 * Deliver due posts — uses env stubs until official APIs are wired.
 */
export async function postNow(limit = 10): Promise<{ posted: number; failed: number }> {
  const table = socialTable();
  if (!table) {
    return { posted: 0, failed: 0 };
  }
  const now = new Date();
  const due = await table.findMany({
    where: { status: "pending", scheduledAt: { lte: now } },
    orderBy: { scheduledAt: "asc" },
    take: limit,
  });

  let posted = 0;
  let failed = 0;

  for (const row of due) {
    try {
      const ok = await publishStub(row.platform, row.content);
      if (ok) {
        await table.update({
          where: { id: row.id },
          data: { status: "posted", postedAt: new Date(), lastError: null },
        });
        posted += 1;
      } else {
        await table.update({
          where: { id: row.id },
          data: { status: "failed", lastError: "API not configured (stub)" },
        });
        failed += 1;
      }
    } catch (e) {
      logError("socialScheduler postNow", e);
      await table.update({
        where: { id: row.id },
        data: { status: "failed", lastError: String(e).slice(0, 2000) },
      });
      failed += 1;
    }
  }

  return { posted, failed };
}

async function publishStub(platform: string, content: unknown): Promise<boolean> {
  const envKey =
    platform === "linkedin"
      ? "LINKEDIN_ACCESS_TOKEN"
      : platform === "instagram"
        ? "META_INSTAGRAM_ACCESS_TOKEN"
        : "X_BEARER_TOKEN";
  if (!process.env[envKey]) {
    console.info(`[socialScheduler] ${platform}: missing ${envKey} — stub only`);
    return false;
  }
  console.info(`[socialScheduler] would publish to ${platform}`, content);
  return true;
}
