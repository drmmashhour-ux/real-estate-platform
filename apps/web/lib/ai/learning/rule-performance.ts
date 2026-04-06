import { prisma } from "@/lib/db";
import type { OutcomeType } from "./feedback-score";

function isSuccessBucket(outcomeType: OutcomeType): boolean {
  return outcomeType === "approved" || outcomeType === "applied" || outcomeType === "success";
}

/**
 * Increments total and either successCount or failureCount from the outcome bucket.
 */
export async function updateRulePerformance(ruleName: string, outcomeType: OutcomeType): Promise<void> {
  const success = isSuccessBucket(outcomeType);
  await prisma.aiRulePerformance.upsert({
    where: { ruleName },
    create: {
      ruleName,
      total: 1,
      successCount: success ? 1 : 0,
      failureCount: success ? 0 : 1,
    },
    update: {
      total: { increment: 1 },
      ...(success ? { successCount: { increment: 1 } } : { failureCount: { increment: 1 } }),
    },
  });
}
