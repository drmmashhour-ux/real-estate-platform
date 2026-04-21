import * as repo from "../repository/playbook-memory.repository";
import { buildMarketKey, buildSegmentKey, buildSimilarityFingerprint } from "../utils/playbook-memory-fingerprint";
import type { PlaybookComparableContext } from "../types/playbook-memory.types";
import { playbookLog } from "../playbook-memory.logger";

/** Refresh retrieval rows for recent memory records (V1: batch insert). */
export async function runPlaybookRetrievalIndexRefresh(params?: { batchSize?: number }) {
  const batchSize = params?.batchSize ?? 100;
  const memories = await repo.findRecentMemoryRecords(batchSize);

  let writes = 0;
  for (const m of memories) {
    try {
      const snap = m.contextSnapshot as PlaybookComparableContext | null;
      if (!snap || typeof snap !== "object") continue;
      const fp = m.similarityFingerprint ?? buildSimilarityFingerprint(snap);
      const segmentKey = m.segmentKey ?? buildSegmentKey(snap);
      const marketKey = m.marketKey ?? buildMarketKey(snap);

      await repo.createRetrievalIndex({
        domain: m.domain,
        entityType: snap.entityType ?? "unknown",
        entityId: snap.entityId ?? m.id,
        segmentKey,
        marketKey,
        fingerprint: fp,
        features: snap as object,
        memoryRecord: { connect: { id: m.id } },
        memoryPlaybook: m.memoryPlaybookId ? { connect: { id: m.memoryPlaybookId } } : undefined,
        score: m.initialConfidence ?? undefined,
      });
      writes += 1;
    } catch (e) {
      playbookLog.error("retrieval index row failed", {
        id: m.id,
        message: e instanceof Error ? e.message : String(e),
      });
    }
  }

  playbookLog.info("runPlaybookRetrievalIndexRefresh", { writes });
  return { writes };
}
