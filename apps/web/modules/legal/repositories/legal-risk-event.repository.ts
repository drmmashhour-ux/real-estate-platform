import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { legalEngineLog } from "../legal-logging";

export async function insertLegalRiskEventSafe(params: {
  entityType: string;
  entityId: string;
  riskType: string;
  score: number;
  flags: string[];
  explanation: string;
}): Promise<string | null> {
  try {
    const row = await prisma.legalRiskEvent.create({
      data: {
        entityType: params.entityType,
        entityId: params.entityId,
        riskType: params.riskType,
        score: params.score,
        flags: params.flags as Prisma.InputJsonValue,
        explanation: params.explanation,
      },
    });
    return row.id;
  } catch (e) {
    legalEngineLog("legal risk event insert failed", { error: String(e) });
    return null;
  }
}
