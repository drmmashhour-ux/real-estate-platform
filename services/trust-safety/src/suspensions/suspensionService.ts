import type { Prisma } from "../generated/prisma/index.js";
import { prisma } from "../db.js";
import type { CreateSuspensionBody } from "../validation/schemas.js";

function toSuspensionResponse(s: {
  id: string;
  targetType: string;
  targetId: string;
  reason: string;
  status: string;
  suspendedAt: Date;
  expiresAt: Date | null;
  suspendedById: string | null;
  liftedAt: Date | null;
  liftedById: string | null;
}) {
  return {
    id: s.id,
    targetType: s.targetType,
    targetId: s.targetId,
    reason: s.reason,
    status: s.status,
    suspendedAt: s.suspendedAt.toISOString(),
    expiresAt: s.expiresAt?.toISOString() ?? null,
    suspendedById: s.suspendedById ?? null,
    liftedAt: s.liftedAt?.toISOString() ?? null,
    liftedById: s.liftedById ?? null,
  };
}

export async function createSuspension(data: CreateSuspensionBody) {
  const expiresAt = data.expiresAt != null ? new Date(data.expiresAt) : null;
  const suspension = await prisma.suspension.create({
    data: {
      targetType: data.targetType,
      targetId: data.targetId,
      reason: data.reason,
      suspendedById: data.suspendedById ?? undefined,
      expiresAt,
    },
  });
  return toSuspensionResponse(suspension);
}

/** Check if a target (user or listing) is currently suspended. */
export async function isSuspended(targetType: "ACCOUNT" | "LISTING", targetId: string): Promise<boolean> {
  const now = new Date();
  const active = await prisma.suspension.findFirst({
    where: {
      targetType,
      targetId,
      status: "ACTIVE",
      OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
    },
  });
  return !!active;
}

/** List active suspensions (optional filter by targetType, targetId). */
export async function listSuspensions(filters: { targetType?: "ACCOUNT" | "LISTING"; targetId?: string; status?: "ACTIVE" | "LIFTED" | "EXPIRED" }) {
  const where: Prisma.SuspensionWhereInput = {};
  if (filters.targetType) where.targetType = filters.targetType;
  if (filters.targetId) where.targetId = filters.targetId;
  if (filters.status) where.status = filters.status;

  const items = await prisma.suspension.findMany({
    where,
    orderBy: { suspendedAt: "desc" },
  });
  return { data: items.map(toSuspensionResponse) };
}
