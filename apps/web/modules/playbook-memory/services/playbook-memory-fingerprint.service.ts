import type { FingerprintResult, PlaybookComparableContext } from "../types/playbook-memory.types";
import {
  buildMarketKey,
  buildSegmentKey,
  buildSimilarityFingerprint,
  extractComparableFeatures,
} from "../utils/playbook-memory-fingerprint";
import { normalizeContextSnapshot } from "../utils/playbook-memory-normalize";

/**
 * Single entrypoint for routes/services — context keys for retrieval + storage.
 */
export function buildContextKeys(context: PlaybookComparableContext): FingerprintResult {
  const asRecord = { ...context } as unknown as Record<string, unknown>;
  const clean = normalizeContextSnapshot(asRecord);
  const domain = (clean.domain ?? context.domain) as PlaybookComparableContext["domain"];
  const entityType = (clean.entityType ?? context.entityType) as string;
  const c: PlaybookComparableContext = {
    domain,
    entityType,
    entityId: (clean.entityId as string) ?? context.entityId,
    market: (clean.market as PlaybookComparableContext["market"]) ?? context.market,
    segment: (clean.segment as PlaybookComparableContext["segment"]) ?? context.segment,
    signals: (clean.signals as PlaybookComparableContext["signals"]) ?? context.signals,
  };
  return {
    segmentKey: buildSegmentKey(c),
    marketKey: buildMarketKey(c),
    fingerprint: buildSimilarityFingerprint(c),
    features: extractComparableFeatures(c) as Record<string, unknown>,
  };
}
