import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { logComplianceModuleAudit } from "@/lib/compliance/compliance-module-audit";

export async function createAutopilotProposal(input: {
  ownerType: string;
  ownerId: string;
  moduleKey: string;
  proposalType: string;
  entityType?: string | null;
  entityId?: string | null;
  content: unknown;
  rationale?: string | null;
  sourceSummary?: unknown;
  actorUserId?: string | null;
}) {
  const row = await prisma.aiAutopilotProposal.create({
    data: {
      ownerType: input.ownerType,
      ownerId: input.ownerId,
      moduleKey: input.moduleKey,
      proposalType: input.proposalType,
      entityType: input.entityType ?? null,
      entityId: input.entityId ?? null,
      content: input.content as Prisma.InputJsonValue,
      rationale: input.rationale ?? null,
      sourceSummary:
        input.sourceSummary == null ? undefined : (input.sourceSummary as Prisma.InputJsonValue),
      requiresReview: true,
    },
  });

  await logComplianceModuleAudit({
    actorUserId: input.actorUserId,
    action: "ai_autopilot_proposal_created",
    payload: {
      entityId: row.id,
      moduleKey: row.moduleKey,
      proposalType: row.proposalType,
    },
  });

  return row;
}
