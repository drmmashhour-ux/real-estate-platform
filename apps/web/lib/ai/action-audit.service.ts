import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";

export type AiActionAuditInput = {
  listingId: string;
  flags: unknown;
  decision: unknown;
  actions: unknown;
  executed: boolean;
};

/**
 * One row per autonomy pass: plan + whether writes completed successfully.
 */
export async function recordAiActionAudit(input: AiActionAuditInput): Promise<void> {
  await prisma.aiActionAudit.create({
    data: {
      listingId: input.listingId,
      flags: (input.flags ?? null) as Prisma.InputJsonValue,
      decision: (input.decision ?? null) as Prisma.InputJsonValue,
      actions: (input.actions ?? null) as Prisma.InputJsonValue,
      executed: input.executed,
    },
  });
}
