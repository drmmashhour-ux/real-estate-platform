import type { PlatformRole } from "@prisma/client";
import { prisma } from "@/lib/db";

function isAdminRole(role: PlatformRole): boolean {
  return role === "ADMIN" || role === "CONTENT_OPERATOR" || role === "LISTING_OPERATOR";
}

const ACTIVE = ["detected", "recommended", "pending_approval", "approved"] as const;

/**
 * Archives or expires stale queue rows — no deletes; status-only updates.
 */
export async function runStaleActionSweep(opts: { viewerId: string; role: PlatformRole }): Promise<{
  archived: number;
  expired: number;
}> {
  const admin = isAdminRole(opts.role);
  const baseWhere = admin ? {} : { subjectUserId: opts.viewerId };

  const now = Date.now();
  const sevenDays = new Date(now - 7 * 86400000);
  const thirtyDays = new Date(now - 30 * 86400000);

  const lowStale = await prisma.platformAutopilotAction.findMany({
    where: {
      ...baseWhere,
      status: { in: [...ACTIVE] },
      priorityBucket: "LOW_PRIORITY",
      updatedAt: { lt: sevenDays },
    },
    select: { id: true },
  });

  const lowQualityStale = await prisma.platformAutopilotAction.findMany({
    where: {
      ...baseWhere,
      status: { in: [...ACTIVE] },
      qualityScore: { not: null, lt: 22 },
      duplicateCount: { gte: 6 },
      updatedAt: { lt: sevenDays },
    },
    select: { id: true },
  });

  const veryOld = await prisma.platformAutopilotAction.findMany({
    where: {
      ...baseWhere,
      status: { in: [...ACTIVE] },
      createdAt: { lt: thirtyDays },
      OR: [{ priorityBucket: "LOW_PRIORITY" }, { qualityScore: { not: null, lt: 25 } }],
    },
    select: { id: true },
  });

  const archiveIds = [...new Set([...lowStale, ...lowQualityStale].map((x) => x.id))];
  const expireIds = veryOld.filter((x) => !archiveIds.includes(x.id)).map((x) => x.id);

  let archived = 0;
  let expired = 0;

  if (archiveIds.length) {
    const r = await prisma.platformAutopilotAction.updateMany({
      where: { id: { in: archiveIds } },
      data: { status: "archived" },
    });
    archived = r.count;
  }

  if (expireIds.length) {
    const r = await prisma.platformAutopilotAction.updateMany({
      where: { id: { in: expireIds } },
      data: { status: "expired" },
    });
    expired = r.count;
  }

  return { archived, expired };
}
