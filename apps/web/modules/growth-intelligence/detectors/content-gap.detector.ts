import { GROWTH_CONTENT_FRESHNESS_STALE_DAYS } from "../growth.config";
import type { GrowthSignal } from "../growth.types";
import type { GrowthSnapshot } from "../growth.types";
import { stableSignalId } from "./growth-detector-utils";

export function detectContentGap(snapshot: GrowthSnapshot): GrowthSignal[] {
  const out: GrowthSignal[] = [];
  const cf = snapshot.contentFreshness;
  if (!cf || cf.oldestSeoBlogDays == null) return out;
  if (cf.oldestSeoBlogDays < GROWTH_CONTENT_FRESHNESS_STALE_DAYS) return out;

  out.push({
    id: stableSignalId(["content_gap", "seo_blog", snapshot.country]),
    signalType: "content_gap",
    severity: cf.oldestSeoBlogDays > GROWTH_CONTENT_FRESHNESS_STALE_DAYS * 2 ? "warning" : "info",
    entityType: "content_corpus",
    entityId: null,
    region: null,
    locale: snapshot.locale,
    country: snapshot.country,
    title: "SEO blog corpus aging",
    explanation: `Oldest SEO blog row is ${cf.oldestSeoBlogDays} days since update — schedule editorial refresh or brief (draft-only until approved).`,
    observedAt: snapshot.collectedAt,
    metadata: { oldestSeoBlogDays: cf.oldestSeoBlogDays, recentPostCount: cf.recentPostCount },
  });
  return out;
}
