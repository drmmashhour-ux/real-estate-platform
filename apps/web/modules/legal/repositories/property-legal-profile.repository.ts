import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { legalEngineLog } from "../legal-logging";
import type { ListingScope } from "../legal-evaluation.types";

export async function upsertPropertyLegalProfileSafe(params: {
  listingScope: ListingScope;
  listingId: string;
  latentDefectRiskScore: number;
  disclosureRiskScore: number;
  fraudRiskScore: number;
  overallLegalRiskScore: number;
  latestRiskLevel: string;
  signals: Record<string, unknown>;
}): Promise<boolean> {
  try {
    await prisma.propertyLegalProfile.upsert({
      where: {
        listingScope_listingId: {
          listingScope: params.listingScope,
          listingId: params.listingId,
        },
      },
      create: {
        listingScope: params.listingScope,
        listingId: params.listingId,
        latentDefectRiskScore: params.latentDefectRiskScore,
        disclosureRiskScore: params.disclosureRiskScore,
        fraudRiskScore: params.fraudRiskScore,
        overallLegalRiskScore: params.overallLegalRiskScore,
        latestRiskLevel: params.latestRiskLevel,
        lastEvaluatedAt: new Date(),
        signals: params.signals as Prisma.InputJsonValue,
      },
      update: {
        latentDefectRiskScore: params.latentDefectRiskScore,
        disclosureRiskScore: params.disclosureRiskScore,
        fraudRiskScore: params.fraudRiskScore,
        overallLegalRiskScore: params.overallLegalRiskScore,
        latestRiskLevel: params.latestRiskLevel,
        lastEvaluatedAt: new Date(),
        signals: params.signals as Prisma.InputJsonValue,
      },
    });
    return true;
  } catch (e) {
    legalEngineLog("property legal profile upsert failed", { error: String(e) });
    return false;
  }
}
