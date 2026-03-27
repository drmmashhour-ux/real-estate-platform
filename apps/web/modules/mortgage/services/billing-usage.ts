import type { Prisma } from "@prisma/client";
import { getMortgagePlanDefaults } from "@/modules/mortgage/services/subscription-plans";

/** UTC calendar month key `YYYY-MM`. */
export function mortgageBillingUtcMonthKey(d = new Date()): string {
  return d.toISOString().slice(0, 7);
}

export type ExpertForMonthlyCap = {
  expertSubscription: { isActive: boolean; maxLeadsPerMonth: number; plan: string } | null;
};

/**
 * Effective monthly lead cap: inactive subscription → basic cap; -1 = unlimited.
 */
export function mortgageExpertMonthlyCap(expert: ExpertForMonthlyCap): number {
  const sub = expert.expertSubscription;
  if (!sub?.isActive) {
    return getMortgagePlanDefaults("basic").maxLeadsPerMonth;
  }
  return sub.maxLeadsPerMonth;
}

export type ExpertBillingRow = {
  leadsAssignedThisMonth: number;
  usageMonthUtc: string | null;
};

/**
 * After rollover, returns `(usedThisMonth, monthKey)`.
 */
export function mortgageMonthlyUsedAfterRollover(
  billing: ExpertBillingRow | null,
  monthKey: string = mortgageBillingUtcMonthKey()
): { used: number; monthKey: string } {
  if (!billing || !billing.usageMonthUtc || billing.usageMonthUtc !== monthKey) {
    return { used: 0, monthKey };
  }
  return { used: billing.leadsAssignedThisMonth, monthKey };
}

export function mortgageExpertHasMonthlyCapacity(
  expert: ExpertForMonthlyCap,
  billing: ExpertBillingRow | null,
  monthKey: string = mortgageBillingUtcMonthKey()
): boolean {
  const cap = mortgageExpertMonthlyCap(expert);
  if (cap < 0) return true;
  const { used } = mortgageMonthlyUsedAfterRollover(billing, monthKey);
  return used < cap;
}

/** Ensure 1:1 billing row exists (no Stripe fields required). */
export async function ensureExpertBillingRow(
  tx: Prisma.TransactionClient,
  expertId: string
): Promise<void> {
  await tx.expertBilling.upsert({
    where: { expertId },
    create: {
      expertId,
      plan: "basic",
      status: "active",
      usageMonthUtc: mortgageBillingUtcMonthKey(),
      leadsAssignedThisMonth: 0,
    },
    update: {},
  });
}

/**
 * Increment monthly assignment counter with UTC month rollover. Returns false if monthly cap hit.
 * Call only after daily slot + credits checks succeed.
 */
export async function incrementExpertMonthlyLeadAssignment(
  tx: Prisma.TransactionClient,
  expertId: string,
  monthCap: number
): Promise<boolean> {
  const monthKey = mortgageBillingUtcMonthKey();
  const billing = await tx.expertBilling.findUnique({ where: { expertId } });
  if (!billing) {
    await ensureExpertBillingRow(tx, expertId);
  }
  const current = await tx.expertBilling.findUnique({ where: { expertId } });
  if (!current) return false;

  const isNewMonth = !current.usageMonthUtc || current.usageMonthUtc !== monthKey;
  const used = isNewMonth ? 0 : current.leadsAssignedThisMonth;

  if (monthCap >= 0 && used >= monthCap) return false;

  await tx.expertBilling.update({
    where: { expertId },
    data: {
      usageMonthUtc: monthKey,
      leadsAssignedThisMonth: used + 1,
    },
  });
  return true;
}
