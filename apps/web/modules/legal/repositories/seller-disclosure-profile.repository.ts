import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { legalFraudLog } from "../legal-logging";

export async function upsertSellerDisclosureProfileSafe(params: {
  sellerUserId: string;
  misrepresentationScore: number;
  recurringPatternCount: number;
  signals: Record<string, unknown>;
}): Promise<boolean> {
  try {
    await prisma.sellerDisclosureProfile.upsert({
      where: { sellerUserId: params.sellerUserId },
      create: {
        sellerUserId: params.sellerUserId,
        misrepresentationScore: params.misrepresentationScore,
        recurringPatternCount: params.recurringPatternCount,
        signals: params.signals as Prisma.InputJsonValue,
        lastEvaluatedAt: new Date(),
      },
      update: {
        misrepresentationScore: params.misrepresentationScore,
        recurringPatternCount: params.recurringPatternCount,
        signals: params.signals as Prisma.InputJsonValue,
        lastEvaluatedAt: new Date(),
      },
    });
    return true;
  } catch (e) {
    legalFraudLog("seller disclosure profile upsert failed", { error: String(e) });
    return false;
  }
}
