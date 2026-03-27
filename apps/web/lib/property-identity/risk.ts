/**
 * Property identity risk: score and level from anti-fraud or manual review.
 */

import { prisma } from "@/lib/db";
import type { RiskLevel } from "./constants";
import { recordEvent } from "./events";

export async function upsertPropertyIdentityRisk(
  propertyIdentityId: string,
  data: { riskScore: number; riskLevel: RiskLevel; riskReasons?: unknown },
  createdBy?: string | null
): Promise<void> {
  const now = new Date();
  await prisma.propertyIdentityRisk.create({
    data: {
      propertyIdentityId,
      riskScore: data.riskScore,
      riskLevel: data.riskLevel,
      riskReasons: data.riskReasons ? (data.riskReasons as object) : undefined,
      lastEvaluatedAt: now,
    },
  });
  await recordEvent(propertyIdentityId, "risk_updated", { riskScore: data.riskScore, riskLevel: data.riskLevel }, createdBy ?? null);
}

export async function getPropertyIdentityRisk(propertyIdentityId: string) {
  return prisma.propertyIdentityRisk.findFirst({
    where: { propertyIdentityId },
    orderBy: { lastEvaluatedAt: "desc" },
  });
}
