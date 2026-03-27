import { prisma } from "@/lib/db";

export type ApplyMortgageUnlockSource = "free_weekly" | "paid";

export async function applyMortgageContactUnlock(params: {
  mortgageRequestId: string;
  mortgageBrokerId: string;
  payingUserId?: string;
  amountCents: number;
  source: ApplyMortgageUnlockSource;
}): Promise<
  | { ok: true; duplicate: boolean }
  | { ok: false; reason: "not_found" | "forbidden" | "amount_mismatch" | "already_unlocked_other" }
> {
  const { mortgageRequestId, mortgageBrokerId, payingUserId, amountCents, source } = params;

  return prisma.$transaction(async (tx) => {
    const row = await tx.mortgageRequest.findUnique({
      where: { id: mortgageRequestId },
      select: {
        id: true,
        brokerId: true,
        contactUnlocked: true,
        unlockedByBrokerId: true,
        leadValue: true,
      },
    });
    if (!row || !row.brokerId) {
      return { ok: false, reason: "not_found" };
    }
    if (row.brokerId !== mortgageBrokerId) {
      return { ok: false, reason: "forbidden" };
    }

    if (payingUserId) {
      const broker = await tx.mortgageBroker.findFirst({
        where: { id: mortgageBrokerId, userId: payingUserId },
        select: { id: true },
      });
      if (!broker) {
        return { ok: false, reason: "forbidden" };
      }
    }

    if (row.contactUnlocked && row.unlockedByBrokerId === mortgageBrokerId) {
      return { ok: true, duplicate: true };
    }

    const existing = await tx.mortgageLeadUnlock.findUnique({
      where: { mortgageRequestId },
    });
    if (existing) {
      return { ok: true, duplicate: true };
    }

    if (row.contactUnlocked && row.unlockedByBrokerId && row.unlockedByBrokerId !== mortgageBrokerId) {
      return { ok: false, reason: "already_unlocked_other" };
    }

    if (source === "paid" && amountCents > 0) {
      const expected = Math.round(row.leadValue * 100);
      if (amountCents !== expected) {
        return { ok: false, reason: "amount_mismatch" };
      }
    }

    await tx.mortgageLeadUnlock.create({
      data: {
        mortgageRequestId,
        brokerId: mortgageBrokerId,
        amountCents,
        source,
      },
    });

    await tx.mortgageRequest.update({
      where: { id: mortgageRequestId },
      data: {
        contactUnlocked: true,
        unlockedByBrokerId: mortgageBrokerId,
        contactUnlockedAt: new Date(),
        isPurchasedLead: true,
      },
    });

    const revenueDelta = source === "paid" && amountCents > 0 ? row.leadValue : 0;
    await tx.mortgageBroker.update({
      where: { id: mortgageBrokerId },
      data: {
        totalLeadUnlocks: { increment: 1 },
        ...(revenueDelta > 0 ? { totalLeadUnlockRevenue: { increment: revenueDelta } } : {}),
      },
    });

    return { ok: true, duplicate: false };
  });
}
