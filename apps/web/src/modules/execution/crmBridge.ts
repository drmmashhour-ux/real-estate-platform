import { prisma } from "@/lib/db";
import type { ExecutionActionType } from "./constants";

/** Record a CRM touch against a platform user (appears in execution action log). */
export async function logCrmUserAction(type: ExecutionActionType, userId: string, status = "done") {
  return prisma.executionAction.create({
    data: { type, userId, status },
  });
}

/** Mark a user-attributed conversion (e.g. lead won, booking attributed). */
export async function logConversion(userId: string) {
  return prisma.executionAction.create({
    data: { type: "close", userId, status: "converted" },
  });
}

export async function recentCrmExecutionActions(take = 20) {
  return prisma.executionAction.findMany({
    orderBy: { createdAt: "desc" },
    take,
    include: {
      user: { select: { id: true, email: true, name: true, role: true } },
    },
  });
}
