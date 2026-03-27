import type { Prisma } from "@prisma/client";
import {
  ReadinessLevel,
  TrustLevel,
  VerificationCaseStatus,
  VerificationEntityType,
  VerificationSeverity,
} from "@prisma/client";
import { prisma } from "@/lib/db";
import { toQueueItemDto } from "@/lib/trustgraph/application/dto/queueItemDto";
import type { QueueQuery } from "@/lib/trustgraph/infrastructure/validation/queueQuerySchema";

function parseEnum<T extends string>(val: string | undefined, allowed: readonly T[]): T | undefined {
  if (!val) return undefined;
  return (allowed as readonly string[]).includes(val) ? (val as T) : undefined;
}

export function buildVerificationQueueWhere(q: QueueQuery): Prisma.VerificationCaseWhereInput {
  const and: Prisma.VerificationCaseWhereInput[] = [];

  const st = parseEnum(q.status, Object.values(VerificationCaseStatus));
  if (st) and.push({ status: st });

  const et = parseEnum(q.entityType, Object.values(VerificationEntityType));
  if (et) and.push({ entityType: et });

  const tl = parseEnum(q.trustLevel, Object.values(TrustLevel));
  if (tl) and.push({ trustLevel: tl });

  const rl = parseEnum(q.readinessLevel, Object.values(ReadinessLevel));
  if (rl) and.push({ readinessLevel: rl });

  if (q.assignedTo?.trim()) {
    and.push({ assignedTo: q.assignedTo.trim() });
  }

  const sev = parseEnum(q.severity, Object.values(VerificationSeverity));
  if (sev) {
    and.push({ signals: { some: { severity: sev } } });
  }

  if (q.search?.trim()) {
    const s = q.search.trim();
    const or: Prisma.VerificationCaseWhereInput[] = [
      { entityId: { contains: s, mode: "insensitive" } },
    ];
    if (/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(s)) {
      or.push({ id: s });
    }
    and.push({ OR: or });
  }

  return and.length ? { AND: and } : {};
}

export async function loadVerificationQueue(q: QueueQuery) {
  const where = buildVerificationQueueWhere(q);

  const [total, rows] = await prisma.$transaction([
    prisma.verificationCase.count({ where }),
    prisma.verificationCase.findMany({
      where,
      orderBy: { updatedAt: "desc" },
      skip: (q.page - 1) * q.pageSize,
      take: q.pageSize,
      include: {
        signals: { select: { severity: true } },
      },
    }),
  ]);

  return {
    total,
    page: q.page,
    pageSize: q.pageSize,
    items: rows.map(toQueueItemDto),
  };
}

export async function loadVerificationQueueStats() {
  const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const [totalOpen, criticalHigh, pendingReview, recentlyUpdated] = await Promise.all([
    prisma.verificationCase.count({
      where: { status: { notIn: ["approved", "rejected"] } },
    }),
    prisma.verificationCase.count({
      where: {
        status: { notIn: ["approved", "rejected"] },
        signals: { some: { severity: { in: ["critical", "high"] } } },
      },
    }),
    prisma.verificationCase.count({
      where: { status: { in: ["pending", "in_review", "needs_info"] } },
    }),
    prisma.verificationCase.count({
      where: { updatedAt: { gte: dayAgo } },
    }),
  ]);

  return { totalOpen, criticalHigh, pendingReview, recentlyUpdated };
}
