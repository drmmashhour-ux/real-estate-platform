import { prisma } from "@/lib/db";
import { isTrustGraphEnabled } from "@/lib/trustgraph/config";
import { isTrustGraphLeadRoutingEnabled } from "@/lib/trustgraph/feature-flags";
import { rankBrokerUsersForLeadRouting } from "@/lib/trustgraph/infrastructure/services/trustAwareLeadRoutingService";

const MAX_BROKER_CANDIDATES = 80;

/**
 * Resolves a primary broker using TrustGraph when env-based overrides are absent.
 */
export async function resolveTrustAwarePrimaryBrokerUserId(): Promise<string | undefined> {
  if (!isTrustGraphEnabled() || !isTrustGraphLeadRoutingEnabled()) {
    return undefined;
  }

  const users = await prisma.user.findMany({
    where: { role: "BROKER" },
    select: { id: true },
    orderBy: { createdAt: "asc" },
    take: MAX_BROKER_CANDIDATES,
  });
  if (users.length === 0) return undefined;

  const { recommendedBrokerIds } = await rankBrokerUsersForLeadRouting(users.map((u) => u.id));
  if (recommendedBrokerIds.length === 0) return undefined;
  return recommendedBrokerIds[0];
}
