import { prisma } from "@/lib/db";
import type { ExecutiveScope } from "../owner-access/owner-access.types";
import { storedScopeMatchesSession } from "../founder-intelligence/founder-scope";
import type { BriefingListRow } from "./executive-briefing.types";

export async function listBriefingsForScope(
  scope: ExecutiveScope,
  userId: string,
  take = 30,
): Promise<BriefingListRow[]> {
  const rows = await prisma.executiveBriefing.findMany({
    where: { createdByUserId: userId },
    orderBy: { createdAt: "desc" },
    take: 80,
    select: {
      id: true,
      periodType: true,
      periodStart: true,
      periodEnd: true,
      status: true,
      createdAt: true,
      updatedAt: true,
      scopeKind: true,
      scopeOfficeIdsJson: true,
    },
  });

  return rows
    .filter((r) => storedScopeMatchesSession(scope, r.scopeKind, r.scopeOfficeIdsJson))
    .slice(0, take)
    .map((r) => ({
      id: r.id,
      periodType: r.periodType,
      periodStart: r.periodStart.toISOString(),
      periodEnd: r.periodEnd.toISOString(),
      status: r.status,
      createdAt: r.createdAt.toISOString(),
      updatedAt: r.updatedAt.toISOString(),
    }));
}

export async function getBriefingByIdForScope(
  id: string,
  scope: ExecutiveScope,
  userId: string,
) {
  const row = await prisma.executiveBriefing.findFirst({
    where: { id, createdByUserId: userId },
    include: { sections: { orderBy: { ordering: "asc" } }, deliveries: true },
  });
  if (!row) return null;
  if (!storedScopeMatchesSession(scope, row.scopeKind, row.scopeOfficeIdsJson)) return null;
  return row;
}
