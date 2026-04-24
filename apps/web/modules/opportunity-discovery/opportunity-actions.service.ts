import type { LecipmOpportunityOutcomeKind } from "@prisma/client";
import { Prisma } from "@prisma/client";
import { prisma } from "@repo/db";

import { recordOpportunityAiAudit } from "./opportunity-audit.service";

export async function markOpportunityReviewed(id: string, brokerUserId: string, actorUserId: string): Promise<{ ok: true } | { ok: false; error: string }> {
  const row = await prisma.lecipmOpportunityCandidate.findFirst({
    where: { id, brokerUserId },
  });
  if (!row) return { ok: false, error: "Not found" };
  await prisma.lecipmOpportunityCandidate.update({
    where: { id },
    data: { status: "REVIEWED" },
  });
  await recordOpportunityAiAudit({
    actorUserId,
    event: "opportunity_reviewed",
    payload: { opportunityId: id },
  });
  return { ok: true };
}

export async function dismissOpportunity(id: string, brokerUserId: string, actorUserId: string): Promise<{ ok: true } | { ok: false; error: string }> {
  const row = await prisma.lecipmOpportunityCandidate.findFirst({
    where: { id, brokerUserId },
  });
  if (!row) return { ok: false, error: "Not found" };
  await prisma.lecipmOpportunityCandidate.update({
    where: { id },
    data: { status: "DISMISSED" },
  });
  await recordOpportunityAiAudit({
    actorUserId,
    event: "opportunity_dismissed",
    payload: { opportunityId: id },
  });
  await prisma.lecipmOpportunityOutcome.create({
    data: {
      opportunityId: id,
      outcomeType: "DISMISSED",
      outcomeValueJson: { source: "broker_dismiss" } as Prisma.InputJsonValue,
    },
  });
  await prisma.evolutionOutcomeEvent.create({
    data: {
      domain: "OPPORTUNITY_AI",
      metricType: "opportunity_dismissed",
      entityType: "lecipm_opportunity_candidate",
      entityId: id,
      actualJson: { dismissedAt: new Date().toISOString() } as Prisma.InputJsonValue,
    },
  });
  return { ok: true };
}

export async function recordOpportunityOutcomeEvent(input: {
  opportunityId: string;
  brokerUserId: string;
  actorUserId: string;
  outcomeType: LecipmOpportunityOutcomeKind;
  outcomeValueJson: Record<string, unknown>;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const row = await prisma.lecipmOpportunityCandidate.findFirst({
    where: { id: input.opportunityId, brokerUserId: input.brokerUserId },
  });
  if (!row) return { ok: false, error: "Not found" };

  await prisma.lecipmOpportunityOutcome.create({
    data: {
      opportunityId: input.opportunityId,
      outcomeType: input.outcomeType,
      outcomeValueJson: input.outcomeValueJson as Prisma.InputJsonValue,
    },
  });
  await prisma.lecipmOpportunityCandidate.update({
    where: { id: input.opportunityId },
    data: { status: "ACTIONED" },
  });
  await recordOpportunityAiAudit({
    actorUserId: input.actorUserId,
    event: "opportunity_actioned",
    payload: { opportunityId: input.opportunityId, outcomeType: input.outcomeType },
  });
  await recordOpportunityAiAudit({
    actorUserId: input.actorUserId,
    event: "outcome_recorded",
    payload: { opportunityId: input.opportunityId, outcomeType: input.outcomeType },
  });
  await prisma.evolutionOutcomeEvent.create({
    data: {
      domain: "OPPORTUNITY_AI",
      metricType: "outcome_recorded",
      entityType: "lecipm_opportunity_candidate",
      entityId: input.opportunityId,
      actualJson: { outcomeType: input.outcomeType, ...input.outcomeValueJson } as Prisma.InputJsonValue,
    },
  });
  return { ok: true };
}
