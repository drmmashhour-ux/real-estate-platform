/**
 * Deadline and reminder logic – overdue steps, due soon.
 */

import { prisma } from "@/lib/db";

export async function getOverdueSteps(limit = 100) {
  const now = new Date();
  return prisma.transactionTimelineStep.findMany({
    where: {
      dueDate: { lt: now },
      status: { in: ["pending", "in_progress"] },
    },
    include: {
      timeline: {
        include: {
          transaction: { select: { id: true, status: true } },
        },
      },
    },
    orderBy: { dueDate: "asc" },
    take: limit,
  });
}

export async function getStepsDueWithinDays(days: number, limit = 100) {
  const now = new Date();
  const future = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
  return prisma.transactionTimelineStep.findMany({
    where: {
      dueDate: { gte: now, lte: future },
      status: { in: ["pending", "in_progress"] },
    },
    include: {
      timeline: {
        include: {
          transaction: { select: { id: true } },
        },
      },
    },
    orderBy: { dueDate: "asc" },
    take: limit,
  });
}

export async function markOverdueSteps() {
  const now = new Date();
  const result = await prisma.transactionTimelineStep.updateMany({
    where: {
      dueDate: { lt: now },
      status: { in: ["pending", "in_progress"] },
    },
    data: { status: "overdue" },
  });
  return result.count;
}
