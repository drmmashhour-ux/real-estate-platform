import { prisma } from "@/lib/db";

/** Approximate clusters with high edge density — conservative admin metric. */
export async function countHighDensityNodeHints(minEdges: number): Promise<number> {
  const nodes = await prisma.trustgraphFraudGraphNode.findMany({ select: { id: true }, take: 200 });
  let n = 0;
  for (const node of nodes) {
    const c = await prisma.trustgraphFraudGraphEdge.count({
      where: { OR: [{ fromNodeId: node.id }, { toNodeId: node.id }] },
    });
    if (c >= minEdges) n += 1;
  }
  return n;
}
