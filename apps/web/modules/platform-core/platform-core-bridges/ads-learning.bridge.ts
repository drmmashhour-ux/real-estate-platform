import type { LearningMemoryHighlights } from "@/modules/ads/ads-learning-store.service";
import { isPlatformCoreAuditEffective } from "@/config/feature-flags";
import { createAuditEvent } from "../platform-core.repository";

export async function ingestAdsLearningPatterns(highlights: LearningMemoryHighlights | null | undefined) {
  if (!highlights) return;
  if (!isPlatformCoreAuditEffective()) return;

  await createAuditEvent({
    eventType: "ADS_LEARNING_SNAPSHOT",
    source: "ADS",
    message: "Learning patterns updated",
    metadata: {
      strongHooks: highlights.topHooks,
      weakHooks: highlights.hooksToAvoid,
      strongCtas: highlights.topCtas,
      weakCtas: highlights.weakCtas,
      topAudiences: highlights.topAudiences,
      weakAudiences: highlights.weakAudiences,
      objectivesBySegment: highlights.objectivesBySegment,
      timestamp: new Date().toISOString(),
    },
  });
}
