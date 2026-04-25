import { prisma } from "@/lib/db";

export async function recordAiHealthEvent(input: {
  level: string;
  source: string;
  message: string;
  payload?: Record<string, unknown>;
  correlationId?: string;
}) {
  return prisma.managerAiHealthEvent.create({
    data: {
      level: input.level,
      source: input.source,
      message: input.message,
      payload: input.payload as object | undefined,
      correlationId: input.correlationId,
    },
  });
}

export async function recentHealthEvents(limit = 50) {
  return prisma.managerAiHealthEvent.findMany({
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}
