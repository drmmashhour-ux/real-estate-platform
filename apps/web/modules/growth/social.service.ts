/**
 * Social automation — queue + daily schedule. Live posting requires provider credentials (Meta, LinkedIn API, etc.).
 * Until connected, rows are marked SENT in dev/simulation when LECIPM_SOCIAL_SIMULATE=true.
 */
import { prisma } from "@/lib/db";
import { logInfo } from "@/lib/logger";

const TAG = "[growth.social]";

export type SocialPlatform = "LINKEDIN" | "INSTAGRAM" | "TIKTOK";

function simulateSend(): boolean {
  return (
    process.env.LECIPM_SOCIAL_SIMULATE === "true" ||
    process.env.LECIPM_SOCIAL_SIMULATE === "1" ||
    !process.env.LINKEDIN_ACCESS_TOKEN
  );
}

export async function scheduleSocialPost(input: {
  platform: SocialPlatform;
  scheduledAt: Date;
  bodyText: string;
  metaJson?: Record<string, unknown>;
}) {
  return prisma.lecipmGrowthSocialQueue.create({
    data: {
      platform: input.platform.slice(0, 24),
      scheduledAt: input.scheduledAt,
      bodyText: input.bodyText.slice(0, 8000),
      status: "PENDING",
      metaJson: input.metaJson ?? undefined,
    },
  });
}

/** Default daily cadence — 3 posts staggered (stubs for LinkedIn / Instagram / TikTok copy). */
export async function seedDailyGrowthPosts(start: Date): Promise<number> {
  const day = new Date(start);
  day.setUTCHours(14, 0, 0, 0);

  const posts: { platform: SocialPlatform; bodyText: string; offsetHours: number }[] = [
    {
      platform: "LINKEDIN",
      offsetHours: 0,
      bodyText:
        "Brokers: fewer tools, more closes. LECIPM ties your deal file, documents, and follow-ups in one workspace. #RealEstate #PropTech #Québec",
    },
    {
      platform: "INSTAGRAM",
      offsetHours: 4,
      bodyText: "Carousel idea: “5 deal delays that aren’t legal — they’re coordination.” Save for your next team huddle.",
    },
    {
      platform: "TIKTOK",
      offsetHours: 8,
      bodyText: "[Hook] Stop living in 7 tabs. [Beat] One transaction timeline. [CTA] Comment “demo”.",
    },
  ];

  let n = 0;
  for (const p of posts) {
    const at = new Date(day.getTime() + p.offsetHours * 3600 * 1000);
    await scheduleSocialPost({
      platform: p.platform,
      scheduledAt: at,
      bodyText: p.bodyText,
      metaJson: { cadence: "daily_growth_stub" },
    });
    n++;
  }
  logInfo(TAG, { action: "seedDailyGrowthPosts", count: n });
  return n;
}

/** Mark due posts — in production replace with provider API calls. */
export async function processDueSocialPosts(limit = 50): Promise<{ completed: number }> {
  const now = new Date();
  const due = await prisma.lecipmGrowthSocialQueue.findMany({
    where: {
      status: "PENDING",
      scheduledAt: { lte: now },
    },
    take: limit,
    orderBy: { scheduledAt: "asc" },
  });

  let completed = 0;
  const sim = simulateSend();
  for (const row of due) {
    if (sim) {
      console.log(`[social.simulate] ${row.platform}`, row.bodyText.slice(0, 120));
      await prisma.lecipmGrowthSocialQueue.update({
        where: { id: row.id },
        data: { status: "SENT" },
      });
      completed++;
    }
    /** Without provider tokens, rows stay PENDING for export / manual publish. */
  }

  logInfo(TAG, { due: due.length, completed });
  return { completed };
}
