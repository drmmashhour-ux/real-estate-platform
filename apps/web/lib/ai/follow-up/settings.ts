import { prisma } from "@/lib/db";

export async function getFollowUpSettings() {
  return prisma.aiFollowUpSettings.upsert({
    where: { id: "global" },
    create: { id: "global" },
    update: {},
  });
}

export async function updateFollowUpSettings(data: {
  enableWhatsapp?: boolean;
  enableSms?: boolean;
  enableVoice?: boolean;
  minutesToSecondTouch?: number;
  hoursToDayOneTouch?: number;
  daysToFinalTouch?: number;
  hotScoreThreshold?: number;
  requireExplicitConsent?: boolean;
  brokerNotifyEmail?: boolean;
  voiceDelayMinutes?: number;
  templatesJson?: object | null;
}) {
  return prisma.aiFollowUpSettings.update({
    where: { id: "global" },
    data: {
      ...data,
      templatesJson: data.templatesJson === null ? undefined : data.templatesJson,
    },
  });
}
