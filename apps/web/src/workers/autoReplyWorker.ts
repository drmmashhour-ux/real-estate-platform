import { prisma } from "@/lib/db";
import { logError, logInfo } from "@/lib/logger";
import {
  isAiAutoReplyEnabled,
  processHighIntentAssistNudgeQueue,
  processOneGrowthAiReply,
} from "@/src/services/growthAiAutoReply";

/**
 * Process growth AI auto-replies (~2 min cron). One AI outbound per pending user turn;
 * 24h guard handled inside `processOneGrowthAiReply`. High-intent assist nudge (once per thread).
 * Silent ghosting nudge runs on `silentNudgeWorker` (~10m cron).
 */
export async function processAutoReplyQueue(limit = 30): Promise<{
  processed: number;
  skipped: number;
  errors: number;
  highIntentNudgesSent: number;
  highIntentNudgesSkipped: number;
}> {
  if (!isAiAutoReplyEnabled()) {
    return { processed: 0, skipped: 0, errors: 0, highIntentNudgesSent: 0, highIntentNudgesSkipped: 0 };
  }

  const conversations = await prisma.growthAiConversation.findMany({
    where: {
      status: "open",
      aiReplyPending: true,
      humanTakeoverAt: null,
      userId: { not: null },
    },
    take: limit,
    orderBy: { updatedAt: "asc" },
    select: { id: true },
  });

  let processed = 0;
  let skipped = 0;
  let errors = 0;

  for (const c of conversations) {
    try {
      const r = await processOneGrowthAiReply(c.id);
      if (r.ok) {
        processed++;
        logInfo("[auto-reply-worker] replied", { conversationId: c.id });
      } else if (r.skipped) {
        skipped++;
      } else {
        errors++;
        logError("[auto-reply-worker] failed", { conversationId: c.id, error: r.error });
      }
    } catch (e) {
      errors++;
      logError("[auto-reply-worker] exception", { conversationId: c.id, error: String(e) });
    }
  }

  const hi = await processHighIntentAssistNudgeQueue(Math.min(20, limit));
  if (hi.sent > 0) {
    logInfo("[auto-reply-worker] high-intent assist nudges", hi);
  }

  return {
    processed,
    skipped,
    errors,
    highIntentNudgesSent: hi.sent,
    highIntentNudgesSkipped: hi.skipped,
  };
}
