import { prisma } from "@/lib/db";
import { getPhase6MoatConfig } from "@/lib/trustgraph/config/phase6-moat";
import { countHighDensityNodeHints } from "@/lib/trustgraph/infrastructure/services/suspiciousClusterService";

export async function antifraudGraphSummary() {
  const cfg = getPhase6MoatConfig().antifraud;
  const [nodes, edges, clusters] = await Promise.all([
    prisma.trustgraphFraudGraphNode.count(),
    prisma.trustgraphFraudGraphEdge.count(),
    countHighDensityNodeHints(cfg.clusterReviewThreshold),
  ]);
  return { nodeCount: nodes, edgeCount: edges, suspiciousClusterHints: clusters };
}
