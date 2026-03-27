import { prisma } from "@/lib/db";
import { isTrustGraphEnabled } from "@/lib/trustgraph/config";
import { isTrustGraphLeadRoutingEnabled } from "@/lib/trustgraph/feature-flags";

/**
 * Batch trust contribution for mortgage lead routing (additive score bump).
 */
export async function trustContributionForMortgageBrokerUsers(
  userIds: (string | null | undefined)[]
): Promise<Map<string, number>> {
  const out = new Map<string, number>();
  if (!isTrustGraphEnabled() || !isTrustGraphLeadRoutingEnabled()) return out;

  const ids = [...new Set(userIds.filter((x): x is string => typeof x === "string" && x.length > 0))];
  if (ids.length === 0) return out;

  const cases = await prisma.verificationCase.findMany({
    where: { entityType: "BROKER", entityId: { in: ids } },
    orderBy: { updatedAt: "desc" },
    select: { entityId: true, overallScore: true },
  });
  for (const c of cases) {
    if (!out.has(c.entityId) && c.overallScore != null) {
      out.set(c.entityId, (c.overallScore / 100) * 12);
    }
  }
  return out;
}
