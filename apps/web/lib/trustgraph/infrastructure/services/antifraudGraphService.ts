import { TrustgraphFraudGraphNodeKind } from "@prisma/client";
import { prisma } from "@/lib/db";
import { recordPlatformEvent } from "@/lib/observability";
import { getPhase6MoatConfig } from "@/lib/trustgraph/config/phase6-moat";
import { isTrustGraphAntifraudGraphEnabled, isTrustGraphEnabled } from "@/lib/trustgraph/feature-flags";
import { createFraudGraphEdge, upsertFraudGraphNode } from "@/lib/trustgraph/infrastructure/services/entityLinkingService";

export async function recomputeFraudGraphForListing(listingId: string): Promise<{ edgeCount: number } | { skipped: true }> {
  if (!isTrustGraphEnabled() || !isTrustGraphAntifraudGraphEnabled()) {
    return { skipped: true };
  }

  const cfg = getPhase6MoatConfig().antifraud;
  const listingNode = await upsertFraudGraphNode(TrustgraphFraudGraphNodeKind.listing, listingId, {
    source: "recompute",
  });

  const fps = await prisma.mediaContentFingerprint.findMany({
    where: { fsboListingId: listingId },
    select: { sha256: true },
    take: cfg.maxEdgesPerRecompute,
  });

  let edges = 0;
  for (const fp of fps) {
    const fn = await upsertFraudGraphNode(TrustgraphFraudGraphNodeKind.fingerprint, fp.sha256, { sha256: fp.sha256 });
    await createFraudGraphEdge({
      fromNodeId: listingNode.id,
      toNodeId: fn.id,
      edgeType: "has_fingerprint",
      evidence: { sha256: fp.sha256 },
      confidence: 1,
    });
    edges += 1;

    const others = await prisma.mediaContentFingerprint.findMany({
      where: { sha256: fp.sha256, NOT: { fsboListingId: listingId } },
      select: { fsboListingId: true },
      take: 20,
    });
    for (const o of others) {
      const ln = await upsertFraudGraphNode(TrustgraphFraudGraphNodeKind.listing, o.fsboListingId);
      await createFraudGraphEdge({
        fromNodeId: fn.id,
        toNodeId: ln.id,
        edgeType: "shares_media_with",
        evidence: { sha256: fp.sha256 },
        confidence: cfg.minEdgeConfidence,
      });
      edges += 1;
      if (edges >= cfg.maxEdgesPerRecompute) break;
    }
    if (edges >= cfg.maxEdgesPerRecompute) break;
  }

  await prisma.trustgraphFraudGraphEvent.create({
    data: {
      eventType: "recompute_listing",
      payload: { listingId, edgeCount: edges } as object,
    },
  });

  void recordPlatformEvent({
    eventType: "trustgraph_fraud_graph_recompute",
    sourceModule: "trustgraph",
    entityType: "FSBO_LISTING",
    entityId: listingId,
    payload: { edgeCount: edges },
  }).catch(() => {});

  return { edgeCount: edges };
}
