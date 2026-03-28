import { prisma } from "@/lib/db";
import { sendTemplatedUserMessage } from "@/src/services/messaging";
import { logError, logInfo } from "@/lib/logger";

/**
 * Due follow-ups: max one per user (`growth_follow_up_sent_at` gate).
 */
export async function processMessagingFollowUps(limit = 50): Promise<{ processed: number; skipped: number }> {
  const now = new Date();
  const users = await prisma.user.findMany({
    where: {
      growthFollowUpDueAt: { lte: now },
      growthFollowUpSentAt: null,
      growthMessagingPaused: false,
    },
    take: limit,
    select: {
      id: true,
      name: true,
      email: true,
      growthOutreachSegment: true,
    },
  });

  let processed = 0;
  let skipped = 0;

  for (const u of users) {
    const segment = (u.growthOutreachSegment && u.growthOutreachSegment.length > 0
      ? u.growthOutreachSegment
      : "warm") as string;
    const name = u.name?.trim() || u.email?.split("@")[0] || "there";
    const r = await sendTemplatedUserMessage(
      u.id,
      segment,
      "follow_up",
      { name, city: "your area" },
      { triggerEvent: "scheduled_follow_up", scheduledFollowUp: true }
    );

    if (r.ok) {
      await prisma.user.update({
        where: { id: u.id },
        data: {
          growthFollowUpSentAt: new Date(),
          growthFollowUpDueAt: null,
        },
      });
      processed++;
      logInfo("[message-worker] follow-up sent", { userId: u.id });
    } else {
      skipped++;
      if (r.error !== "No template warm/follow_up" && r.error !== "Rate limit: 1 / 24h") {
        logError("[message-worker] skip", { userId: u.id, error: r.error });
      }
    }
  }

  return { processed, skipped };
}
