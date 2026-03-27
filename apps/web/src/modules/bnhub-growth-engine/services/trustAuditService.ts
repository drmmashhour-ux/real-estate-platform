import { prisma } from "@/lib/db";
import type { Prisma } from "@prisma/client";

export type EngineAuditPayload = Record<string, unknown>;

export async function logTrustDecision(
  listingId: string | null,
  hostUserId: string | null,
  payload: EngineAuditPayload
): Promise<void> {
  await prisma.bnhubEngineAuditLog.create({
    data: {
      listingId,
      hostUserId,
      decisionType: "trust_profile",
      source: "trustFraudService",
      payloadJson: payload as Prisma.InputJsonValue,
    },
  });
}

export async function logPricingDecision(
  listingId: string,
  hostUserId: string | null,
  payload: EngineAuditPayload
): Promise<void> {
  await prisma.bnhubEngineAuditLog.create({
    data: {
      listingId,
      hostUserId,
      decisionType: "dynamic_pricing",
      source: "dynamicPricingService",
      payloadJson: payload as Prisma.InputJsonValue,
    },
  });
}

export async function logTierDecision(listingId: string, payload: EngineAuditPayload): Promise<void> {
  await prisma.bnhubEngineAuditLog.create({
    data: {
      listingId,
      decisionType: "luxury_tier",
      source: "luxuryTierService",
      payloadJson: payload as Prisma.InputJsonValue,
    },
  });
}

export async function logFraudAction(
  listingId: string | null,
  hostUserId: string | null,
  action: string,
  payload: EngineAuditPayload
): Promise<void> {
  await prisma.bnhubEngineAuditLog.create({
    data: {
      listingId,
      hostUserId,
      decisionType: `fraud:${action}`,
      source: "trustFraudService",
      payloadJson: payload as Prisma.InputJsonValue,
    },
  });
}
