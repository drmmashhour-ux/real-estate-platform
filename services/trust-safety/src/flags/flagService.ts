import { prisma } from "../db.js";
import type { CreateFlagBody, ListFlagsQuery } from "../validation/schemas.js";
import type { Prisma } from "../generated/prisma/index.js";

function toFlagResponse(flag: {
  id: string;
  flaggerId: string;
  targetType: string;
  targetId: string;
  reason: string;
  status: string;
  createdAt: Date;
  reviewedAt: Date | null;
  reviewedById: string | null;
}) {
  return {
    id: flag.id,
    flaggerId: flag.flaggerId,
    targetType: flag.targetType,
    targetId: flag.targetId,
    reason: flag.reason,
    status: flag.status,
    createdAt: flag.createdAt.toISOString(),
    reviewedAt: flag.reviewedAt?.toISOString() ?? null,
    reviewedById: flag.reviewedById ?? null,
  };
}

export async function createFlag(data: CreateFlagBody) {
  const flag = await prisma.flag.create({
    data: {
      flaggerId: data.flaggerId,
      targetType: data.targetType,
      targetId: data.targetId,
      reason: data.reason,
    },
  });
  return toFlagResponse(flag);
}

export async function listFlags(query: ListFlagsQuery) {
  const limit = query.limit ?? 20;
  const offset = query.offset ?? 0;

  const where: Prisma.FlagWhereInput = {};
  if (query.flaggerId) where.flaggerId = query.flaggerId;
  if (query.targetType) where.targetType = query.targetType;
  if (query.targetId) where.targetId = query.targetId;
  if (query.status) where.status = query.status;

  const [items, total] = await Promise.all([
    prisma.flag.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: limit,
      skip: offset,
    }),
    prisma.flag.count({ where }),
  ]);

  return {
    data: items.map(toFlagResponse),
    pagination: { limit, offset, total },
  };
}

/** Moderation queue: pending flags. */
export async function getModerationQueueFlags(limit: number) {
  const items = await prisma.flag.findMany({
    where: { status: "PENDING" },
    orderBy: { createdAt: "asc" },
    take: limit,
  });
  return { data: items.map(toFlagResponse) };
}
