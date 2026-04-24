import type { Prisma } from "@prisma/client";
import { prisma } from "@repo/db";

import { recordOpportunityAiAudit } from "./opportunity-audit.service";
import type { DiscoveredOpportunity } from "./opportunity.types";

function idempotencyKey(brokerUserId: string, o: DiscoveredOpportunity): string {
  return `${brokerUserId}:${o.entityType}:${o.entityId}:${o.opportunityType}`;
}

export async function persistDiscoveredOpportunities(
  brokerUserId: string,
  opportunities: DiscoveredOpportunity[],
  actorUserId: string | null,
): Promise<{ upserted: number }> {
  let upserted = 0;
  for (const o of opportunities) {
    const key = idempotencyKey(brokerUserId, o);
    const existing = await prisma.lecipmOpportunityCandidate.findUnique({ where: { idempotencyKey: key } });
    if (existing?.status === "DISMISSED") continue;

    const rationaleJson = {
      ...o.rationale,
      suggestedNextActions: o.suggestedNextActions,
    } satisfies Record<string, unknown>;

    await prisma.lecipmOpportunityCandidate.upsert({
      where: { idempotencyKey: key },
      create: {
        brokerUserId,
        entityType: o.entityType,
        entityId: o.entityId,
        opportunityType: o.opportunityType,
        score: o.score,
        confidenceScore: o.confidenceScore,
        riskLevel: o.riskLevel,
        rationaleJson: rationaleJson as Prisma.InputJsonValue,
        idempotencyKey: key,
        city: o.city ?? null,
        propertyType: o.propertyType ?? null,
        marketSegment: o.marketSegment ?? null,
        investorReady: o.investorReady ?? false,
        esgRelevant: o.esgRelevant ?? false,
        status: "NEW",
        discoveredAt: new Date(),
      },
      update: {
        score: o.score,
        confidenceScore: o.confidenceScore,
        riskLevel: o.riskLevel,
        rationaleJson: rationaleJson as Prisma.InputJsonValue,
        city: o.city ?? null,
        propertyType: o.propertyType ?? null,
        marketSegment: o.marketSegment ?? null,
        investorReady: o.investorReady ?? false,
        esgRelevant: o.esgRelevant ?? false,
        discoveredAt: new Date(),
      },
    });
    upserted += 1;
  }

  await recordOpportunityAiAudit({
    actorUserId,
    event: "opportunity_discovered",
    payload: { brokerUserId, count: upserted },
  });

  return { upserted };
}
