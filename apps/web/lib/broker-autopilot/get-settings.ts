import type { LecipmBrokerAutopilotSetting } from "@prisma/client";
import { prisma } from "@/lib/db";

export async function getOrCreateBrokerAutopilotSettings(brokerUserId: string): Promise<LecipmBrokerAutopilotSetting> {
  const existing = await prisma.lecipmBrokerAutopilotSetting.findUnique({
    where: { brokerUserId },
  });
  if (existing) return existing;
  return prisma.lecipmBrokerAutopilotSetting.create({
    data: { brokerUserId },
  });
}
