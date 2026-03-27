/**
 * Lifecycle Automation – onboarding milestones, lifecycle stages, reminders, reactivation.
 * Connects user roles, subscriptions, dashboards, notifications.
 */
import { prisma } from "@/lib/db";
import type { LifecycleStage } from "@prisma/client";
import type { Prisma } from "@prisma/client";

export type { LifecycleStage };

/** Get current lifecycle state for user (and optional module). */
export async function getLifecycleState(userId: string, module?: string) {
  const where: Prisma.LifecycleStateWhereInput = { userId };
  if (module) where.module = module;
  return prisma.lifecycleState.findFirst({
    where,
    orderBy: { updatedAt: "desc" },
  });
}

/** Set or update lifecycle state. */
export async function setLifecycleState(params: {
  userId: string;
  stage: LifecycleStage;
  module?: string;
  lastActivityAt?: Date;
  metadata?: object;
}) {
  const existing = await prisma.lifecycleState.findFirst({
    where: {
      userId: params.userId,
      module: params.module ?? null,
    },
    orderBy: { updatedAt: "desc" },
  });
  const data = {
    stage: params.stage,
    lastActivityAt: params.lastActivityAt ?? new Date(),
    metadata: (params.metadata as object) ?? undefined,
  };
  if (existing) {
    return prisma.lifecycleState.update({
      where: { id: existing.id },
      data,
    });
  }
  return prisma.lifecycleState.create({
    data: {
      userId: params.userId,
      module: params.module,
      ...data,
    },
  });
}

/** Update last activity (call on booking, login, listing create, etc.). */
export async function touchLifecycleActivity(userId: string, module?: string) {
  const state = await getLifecycleState(userId, module);
  const now = new Date();
  if (state) {
    return prisma.lifecycleState.update({
      where: { id: state.id },
      data: { lastActivityAt: now },
    });
  }
  return setLifecycleState({
    userId,
    stage: "ACTIVE",
    module,
    lastActivityAt: now,
  });
}

/** Get users in stage (for ops/reactivation). */
export async function getUsersByLifecycleStage(params: {
  stage: LifecycleStage;
  module?: string;
  inactiveOlderThanDays?: number;
  limit?: number;
}) {
  const where: Prisma.LifecycleStateWhereInput = { stage: params.stage };
  if (params.module) where.module = params.module;
  if (params.inactiveOlderThanDays) {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - params.inactiveOlderThanDays);
    where.lastActivityAt = { lt: cutoff };
  }
  return prisma.lifecycleState.findMany({
    where,
    orderBy: { lastActivityAt: "asc" },
    take: params.limit ?? 100,
  });
}
