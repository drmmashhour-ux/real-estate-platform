import { prisma } from "@/lib/db";
import { publishMarketingContent } from "./publish-content";
import type { PublishMarketingContentResult } from "./types";

export type RunDueMarketingPublishesResult = {
  picked: number;
  results: PublishMarketingContentResult[];
};

/**
 * Processes SCHEDULED rows with scheduledAt <= now.
 * @param cronLiveOnly When true (Vercel cron), only rows with publishDryRun=false are selected.
 */
export async function runDueMarketingPublishes(options?: {
  limit?: number;
  cronLiveOnly?: boolean;
}): Promise<RunDueMarketingPublishesResult> {
  const limit = Math.min(Math.max(options?.limit ?? 15, 1), 50);
  const now = new Date();

  const rows = await prisma.marketingContent.findMany({
    where: {
      status: "SCHEDULED",
      scheduledAt: { lte: now },
      ...(options?.cronLiveOnly ? { publishDryRun: false } : {}),
    },
    select: { id: true },
    orderBy: { scheduledAt: "asc" },
    take: limit,
  });

  const results: PublishMarketingContentResult[] = [];
  for (const row of rows) {
    results.push(
      await publishMarketingContent({
        contentId: row.id,
        mode: "scheduled_due",
        cronLiveOnly: options?.cronLiveOnly,
      })
    );
  }

  return { picked: rows.length, results };
}
