import { prisma } from "@/lib/db";
import { getDailyDealFeed } from "@/src/modules/daily-deal-feed/application/getDailyDealFeed";

export async function refreshDailyDealFeed(args: { userId: string; workspaceId?: string | null }) {
  await prisma.dailyDealFeedSnapshot.deleteMany({
    where: {
      userId: args.userId,
      generatedForDate: new Date(new Date().toISOString().slice(0, 10)),
      feedType: "user",
    },
  });

  return getDailyDealFeed(args);
}
