import { PlatformRole } from "@prisma/client";
import { prisma } from "@/lib/db";
import { LEGAL_DOCUMENT_TYPES } from "@/lib/legal/constants";

export type PlatformLegalGateStatus = {
  needsPlatformIntermediary: boolean;
  needsBrokerCollaboration: boolean;
};

export async function getPlatformLegalGateStatus(userId: string): Promise<PlatformLegalGateStatus> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });

  const [platform, broker] = await Promise.all([
    prisma.userAgreement.findFirst({
      where: { userId, documentType: LEGAL_DOCUMENT_TYPES.PLATFORM_INTERMEDIARY_DISCLOSURE },
    }),
    prisma.userAgreement.findFirst({
      where: { userId, documentType: LEGAL_DOCUMENT_TYPES.BROKER_COLLABORATION_CLAUSE },
    }),
  ]);

  const isBrokerish = user?.role === PlatformRole.BROKER || user?.role === PlatformRole.ADMIN;

  return {
    needsPlatformIntermediary: !platform,
    needsBrokerCollaboration: isBrokerish && !broker,
  };
}
