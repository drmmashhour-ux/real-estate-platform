import { TrustgraphFraudGraphNodeKind } from "@prisma/client";
import { prisma } from "@/lib/db";
import type { FraudGraphInvestigationSummary } from "@/lib/trustgraph/domain/antifraud";
import { getPhase6MoatConfig } from "@/lib/trustgraph/config/phase6-moat";
import { isTrustGraphAntifraudGraphEnabled, isTrustGraphEnabled } from "@/lib/trustgraph/feature-flags";

export async function investigateFraudGraphClusterForListing(listingId: string): Promise<FraudGraphInvestigationSummary | null> {
  if (!isTrustGraphEnabled() || !isTrustGraphAntifraudGraphEnabled()) return null;

  const cfg = getPhase6MoatConfig().antifraud;
  const node = await prisma.trustgraphFraudGraphNode.findUnique({
    where: { kind_externalId: { kind: TrustgraphFraudGraphNodeKind.listing, externalId: listingId } },
    select: { id: true },
  });
  if (!node) {
    return {
      clusterId: null,
      edgeCount: 0,
      nodeCount: 0,
      escalationRecommended: false,
      internalReasonCodes: ["no_graph_node"],
    };
  }

  const edgeCount = await prisma.trustgraphFraudGraphEdge.count({
    where: { OR: [{ fromNodeId: node.id }, { toNodeId: node.id }] },
  });

  const escalationRecommended = edgeCount >= cfg.clusterReviewThreshold;

  return {
    clusterId: node.id,
    edgeCount,
    nodeCount: 1,
    escalationRecommended,
    internalReasonCodes: escalationRecommended ? ["edge_density"] : [],
  };
}
