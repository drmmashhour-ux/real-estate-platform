import { prisma } from "@/lib/db";
import { checkGrowthPaywall } from "@/src/modules/growth-funnel/application/checkGrowthPaywall";
import { incrementAiDrafts } from "@/src/modules/growth-funnel/infrastructure/growthFunnelRepository";

/** Call after a successful AI draft when enforcing free-tier AI limits. */
export async function recordAiDraftUsage(userId: string): Promise<{ allowed: boolean; remaining: number }> {
  const u = await prisma.user.findUnique({
    where: { id: userId },
    select: { plan: true, role: true },
  });
  if (!u) return { allowed: false, remaining: 0 };
  const gate = await checkGrowthPaywall({ userId, plan: u.plan, role: u.role, kind: "ai_draft" });
  if (!gate.allowed) return { allowed: false, remaining: gate.remaining };
  await incrementAiDrafts(userId);
  const after = await checkGrowthPaywall({ userId, plan: u.plan, role: u.role, kind: "ai_draft" });
  return { allowed: true, remaining: after.remaining };
}
