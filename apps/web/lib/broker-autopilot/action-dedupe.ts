import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";

const OPEN: Prisma.EnumLecipmBrokerAutopilotActionStatusFilter = {
  in: ["suggested", "queued", "approved"],
};

/**
 * Skip if an open action exists for the same lead + bucket, or if a recent dismiss
 * has no new thread activity since.
 */
export async function shouldCreateAutopilotAction(input: {
  leadId: string;
  reasonBucket: string;
  threadLastMessageAt: Date | null;
}): Promise<boolean> {
  const { leadId, reasonBucket, threadLastMessageAt } = input;

  const open = await prisma.lecipmBrokerAutopilotAction.findFirst({
    where: { leadId, reasonBucket, status: OPEN },
  });
  if (open) return false;

  const recentDismiss = await prisma.lecipmBrokerAutopilotAction.findFirst({
    where: { leadId, reasonBucket, status: "dismissed", dismissedAt: { not: null } },
    orderBy: { dismissedAt: "desc" },
  });
  if (!recentDismiss?.dismissedAt) return true;

  const activity = threadLastMessageAt?.getTime() ?? 0;
  return activity > recentDismiss.dismissedAt.getTime();
}
