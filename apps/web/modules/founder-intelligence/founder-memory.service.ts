import { prisma } from "@/lib/db";
import type { ExecutiveScope } from "../owner-access/owner-access.types";
import type { FounderMemoryBrief } from "./founder-intelligence.types";
import { storedScopeMatchesSession } from "./founder-scope";

/**
 * Recent founder-visible context from persisted decisions + briefings (audit-friendly).
 */
export async function getFounderMemoryContext(
  userId: string,
  scope: ExecutiveScope,
): Promise<FounderMemoryBrief> {
  const [decisions, briefings] = await Promise.all([
    prisma.founderDecisionLog.findMany({
      where: { decidedByUserId: userId },
      orderBy: { createdAt: "desc" },
      take: 8,
      select: { id: true, title: true, createdAt: true },
    }),
    prisma.executiveBriefing.findMany({
      where:
        scope.kind === "platform"
          ? { scopeKind: "platform", createdByUserId: userId }
          : {
              scopeKind: "office",
              createdByUserId: userId,
            },
      orderBy: { createdAt: "desc" },
      take: 12,
      select: { id: true, scopeKind: true, scopeOfficeIdsJson: true },
    }),
  ]);

  const briefingIds = briefings
    .filter((b) => storedScopeMatchesSession(scope, b.scopeKind, b.scopeOfficeIdsJson))
    .slice(0, 5)
    .map((b) => b.id);

  return {
    recentDecisions: decisions.map((d) => ({
      id: d.id,
      title: d.title,
      createdAt: d.createdAt.toISOString(),
    })),
    recentBriefingIds: briefingIds,
  };
}
