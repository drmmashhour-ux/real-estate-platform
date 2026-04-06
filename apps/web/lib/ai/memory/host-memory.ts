import { prisma } from "@/lib/db";

export async function loadHostAutopilotMemory(userId: string) {
  return prisma.managerAiHostAutopilotSettings.findUnique({ where: { userId } });
}
