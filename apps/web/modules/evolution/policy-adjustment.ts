import { prisma } from "@/lib/db";
import { POLICY_WEIGHT_DELTA_CAP, type EvolutionDomain } from "./evolution.types";
import { logEvolution } from "./evolution-logger";

export type PolicyAdjustmentKind = "RANKING_WEIGHT" | "PRICING_PARAM";

/**
 * Create a **pending** policy adjustment — never applied live without human approval.
 * Payload must be small relative deltas (e.g. { key: "search_rank_boost", delta: 0.02 }).
 */
export async function proposePolicyAdjustment(args: {
  domain: EvolutionDomain;
  kind: PolicyAdjustmentKind;
  payloadJson: Record<string, unknown>;
  rationale?: string;
}): Promise<{ id: string }> {
  const delta = typeof args.payloadJson.delta === "number" ? args.payloadJson.delta : 0;
  if (Math.abs(delta) > POLICY_WEIGHT_DELTA_CAP) {
    throw new Error(`delta exceeds cap ${POLICY_WEIGHT_DELTA_CAP}`);
  }

  const row = await prisma.evolutionPolicyAdjustment.create({
    data: {
      domain: args.domain,
      kind: args.kind,
      payloadJson: args.payloadJson as object,
      rationale: args.rationale ?? null,
      status: "PENDING",
      proposedBySource: "REINFORCEMENT_ENGINE",
    },
  });

  logEvolution("adjustment", {
    phase: "proposal_created",
    id: row.id,
    domain: args.domain,
    kind: args.kind,
  });

  return { id: row.id };
}

export async function approvePolicyAdjustment(adjustmentId: string, reviewerUserId: string) {
  const row = await prisma.evolutionPolicyAdjustment.update({
    where: { id: adjustmentId },
    data: {
      status: "APPROVED",
      reviewedByUserId: reviewerUserId,
      reviewedAt: new Date(),
    },
  });
  logEvolution("adjustment", { phase: "approved", id: row.id, reviewerUserId });
  return row;
}

export async function rejectPolicyAdjustment(adjustmentId: string, reviewerUserId: string) {
  const row = await prisma.evolutionPolicyAdjustment.update({
    where: { id: adjustmentId },
    data: {
      status: "REJECTED",
      reviewedByUserId: reviewerUserId,
      reviewedAt: new Date(),
    },
  });
  logEvolution("adjustment", { phase: "rejected", id: row.id, reviewerUserId });
  return row;
}
