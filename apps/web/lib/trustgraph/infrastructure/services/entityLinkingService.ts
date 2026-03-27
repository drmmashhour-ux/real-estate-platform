import type { Prisma } from "@prisma/client";
import { TrustgraphFraudGraphNodeKind } from "@prisma/client";
import { prisma } from "@/lib/db";

export async function upsertFraudGraphNode(
  kind: TrustgraphFraudGraphNodeKind,
  externalId: string,
  metadata?: Prisma.InputJsonValue
) {
  return prisma.trustgraphFraudGraphNode.upsert({
    where: {
      kind_externalId: { kind, externalId },
    },
    create: { kind, externalId, metadata: metadata ?? undefined },
    update: { metadata: metadata ?? undefined },
  });
}

export async function createFraudGraphEdge(args: {
  fromNodeId: string;
  toNodeId: string;
  edgeType: string;
  evidence?: Prisma.InputJsonValue;
  confidence?: number;
}) {
  return prisma.trustgraphFraudGraphEdge.create({
    data: {
      fromNodeId: args.fromNodeId,
      toNodeId: args.toNodeId,
      edgeType: args.edgeType,
      evidence: args.evidence,
      confidence: args.confidence,
    },
  });
}
