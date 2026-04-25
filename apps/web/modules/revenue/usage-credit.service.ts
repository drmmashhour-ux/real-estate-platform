import { prisma } from "@/lib/db";
import { logInfo } from "@/lib/logger";

/**
 * One balance row per user — credits are spent on contract (turbo) PDF export.
 */
export async function getExportCreditBalance(userId: string): Promise<number> {
  const row = await prisma.usageCredit.findUnique({
    where: { userId },
    select: { credits: true },
  });
  return row?.credits ?? 0;
}

export async function grantBrokerExportCreditsFromPayment(input: {
  userId: string;
  creditGrant: number;
  platformPaymentId: string;
}): Promise<void> {
  const n = Math.floor(input.creditGrant);
  if (n < 1) return;

  await prisma.$transaction(async (tx) => {
    const existing = await tx.usageCredit.findUnique({ where: { userId: input.userId } });
    if (existing) {
      await tx.usageCredit.update({
        where: { userId: input.userId },
        data: { credits: { increment: n } },
      });
    } else {
      await tx.usageCredit.create({
        data: { userId: input.userId, credits: n },
      });
    }
  });

  logInfo("[revenue] broker_export_credits granted", {
    userId: input.userId,
    creditGrant: n,
    platformPaymentId: input.platformPaymentId,
  });
}

/**
 * Returns true if one credit was consumed. Caller should run in a path that already
 * verified ownership / gate conditions.
 */
export async function tryConsumeOneExportCredit(userId: string): Promise<boolean> {
  const res = await prisma.$transaction(async (tx) => {
    const row = await tx.usageCredit.findUnique({ where: { userId } });
    if (!row || row.credits < 1) {
      return false;
    }
    await tx.usageCredit.update({
      where: { userId },
      data: { credits: { decrement: 1 } },
    });
    return true;
  });
  return res;
}
