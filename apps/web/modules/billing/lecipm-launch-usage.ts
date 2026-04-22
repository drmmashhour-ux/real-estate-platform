import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { revenueCentsDefaults } from "./lecipm-launch-constants";

export type LecipmBrokerUsageType =
  | "LEAD"
  | "CONTRACT"
  | "SIGNATURE"
  | "CREDIT_CHECK"
  | "TRANSACTION";

export async function recordBrokerUsageEvent(input: {
  userId: string;
  type: LecipmBrokerUsageType;
  amount?: number | null;
  metaJson?: Prisma.InputJsonValue;
}) {
  return prisma.lecipmBrokerUsageEvent.create({
    data: {
      userId: input.userId,
      type: input.type.slice(0, 32),
      amount: input.amount ?? undefined,
      metaJson: input.metaJson ?? undefined,
    },
  });
}

/** Revenue-facing amount in dollars (UsageEvent.amount) — cents defaults / 100. */
export function usageAmountForType(type: LecipmBrokerUsageType): number {
  const cents = revenueCentsDefaults();
  const key =
    type === "CREDIT_CHECK" ? "CREDIT_CHECK"
    : type === "SIGNATURE" ? "SIGNATURE"
    : type === "CONTRACT" ? "CONTRACT"
    : type === "LEAD" ? "LEAD"
    : type === "TRANSACTION" ? "TRANSACTION"
    : "TRANSACTION";
  const c = cents[key] ?? 0;
  return Math.round((c / 100) * 100) / 100;
}

export async function countUsageInMonth(userId: string, type: LecipmBrokerUsageType): Promise<number> {
  const start = new Date();
  start.setDate(1);
  start.setHours(0, 0, 0, 0);
  return prisma.lecipmBrokerUsageEvent.count({
    where: {
      userId,
      type,
      createdAt: { gte: start },
    },
  });
}
