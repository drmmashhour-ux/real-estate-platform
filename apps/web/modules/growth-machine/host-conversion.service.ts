/**
 * Host onboarding funnel hints — suggestions only.
 */
import { prisma } from "@/lib/db";

export async function getHostConversionHints(userId: string) {
  const host = await prisma.bnhubHost.findUnique({
    where: { userId },
    include: { _count: { select: { listings: true } } },
  });
  if (!host) return { nextActions: ["Complete BNHub host application"] as string[] };

  const actions: string[] = [];
  if (host.status === "pending") actions.push("Finish verification steps shown in BNHub host dashboard.");
  if (host._count.listings < 1) {
    actions.push("Publish your first short-term listing to unlock calendar and booking flows.");
  }
  return { nextActions: actions.length ? actions : ["Review pricing and calendar weekly."] };
}
