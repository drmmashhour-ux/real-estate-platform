import type { HostAutopilotSettings } from "@prisma/client";
import { prisma } from "@/lib/db";

export async function getOrCreateHostAutopilotSettings(hostId: string): Promise<HostAutopilotSettings> {
  const existing = await prisma.hostAutopilotSettings.findUnique({ where: { hostId } });
  if (existing) return existing;
  return prisma.hostAutopilotSettings.create({
    data: { hostId },
  });
}
