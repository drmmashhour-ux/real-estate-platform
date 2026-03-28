import { GrowthEmailQueueStatus, GrowthEmailQueueType } from "@prisma/client";
import { prisma } from "@/lib/db";
import { sendEmail, getFromEmail } from "@/lib/email/resend";
import { logError, logInfo } from "@/lib/logger";

const DEFAULT_BATCH = 30;
const MAX_ATTEMPTS = 5;

function templateForType(type: GrowthEmailQueueType, payload: Record<string, unknown>): { subject: string; html: string } {
  switch (type) {
    case "WELCOME":
      return {
        subject: "Welcome to LECIPM + BNHub",
        html: "<p>Thanks for signing up — browse stays, listings, and tools in one place.</p>",
      };
    case "REMINDER":
      return {
        subject: "Complete your LECIPM checkout",
        html: `<p>You left something in checkout. ${payload.kind ? `(${String(payload.kind)})` : ""}</p>`,
      };
    case "FOLLOWUP":
      return {
        subject: "How was your stay?",
        html: "<p>We’d love a quick review — it helps hosts and guests trust BNHub.</p>",
      };
    default:
      return { subject: "LECIPM update", html: "<p>Update from LECIPM.</p>" };
  }
}

/**
 * Process pending `growth_email_queue` rows (call from cron every ~30s).
 */
export async function runGrowthEmailWorkerOnce(
  batchSize = DEFAULT_BATCH
): Promise<{ processed: number; failed: number }> {
  const now = new Date();
  const pending = await prisma.growthEmailQueue.findMany({
    where: {
      status: GrowthEmailQueueStatus.PENDING,
      scheduledAt: { lte: now },
    },
    orderBy: { scheduledAt: "asc" },
    take: batchSize,
    include: { user: { select: { email: true } } },
  });

  let processed = 0;
  let failed = 0;

  for (const row of pending) {
    const email = row.user?.email;
    const payload = (row.payload && typeof row.payload === "object" ? row.payload : {}) as Record<string, unknown>;
    const attempts = typeof payload._attempts === "number" ? payload._attempts : 0;

    if (!email) {
      await prisma.growthEmailQueue.update({
        where: { id: row.id },
        data: {
          status: GrowthEmailQueueStatus.FAILED,
          lastError: "No user email",
        },
      });
      failed++;
      continue;
    }

    const { subject, html } = templateForType(row.type, payload);
    const ok = await sendEmail({ to: email, subject, html });
    if (ok) {
      await prisma.growthEmailQueue.update({
        where: { id: row.id },
        data: {
          status: GrowthEmailQueueStatus.SENT,
          sentAt: new Date(),
          lastError: null,
        },
      });
      processed++;
      logInfo("[growth-email-worker] sent", { id: row.id, type: row.type });
    } else {
      const nextAttempts = attempts + 1;
      if (nextAttempts >= MAX_ATTEMPTS) {
        await prisma.growthEmailQueue.update({
          where: { id: row.id },
          data: {
            status: GrowthEmailQueueStatus.FAILED,
            lastError: "Max attempts — Resend not configured or send failed",
            payload: { ...payload, _attempts: nextAttempts } as object,
          },
        });
        failed++;
      } else {
        await prisma.growthEmailQueue.update({
          where: { id: row.id },
          data: {
            scheduledAt: new Date(Date.now() + 60_000 * nextAttempts),
            lastError: "Send failed; retry scheduled",
            payload: { ...payload, _attempts: nextAttempts } as object,
          },
        });
      }
      logError("[growth-email-worker] send failed", { id: row.id });
    }
  }

  return { processed, failed };
}

/** Alias for cron route (`/api/cron/growth-email-queue`). */
export async function processGrowthEmailQueue(limit = DEFAULT_BATCH) {
  return runGrowthEmailWorkerOnce(limit);
}

/** Long-running loop (CLI / worker process). */
export async function runGrowthEmailWorkerLoop(intervalMs = 30_000): Promise<void> {
  logInfo("[growth-email-worker] loop start", { intervalMs, from: getFromEmail() });
  for (;;) {
    try {
      await runGrowthEmailWorkerOnce();
    } catch (e) {
      logError("[growth-email-worker] batch error", e);
    }
    await new Promise((r) => setTimeout(r, intervalMs));
  }
}
