import type { RecommendationBlock, RecommendationItem, RecommendationStrategy } from "./recommendation.types";

/**
 * Removes duplicate listing ids across sections (keeps first occurrence — higher-priority blocks first).
 */
export function dedupeItemsAcrossBlocks(blocks: RecommendationBlock[]): RecommendationBlock[] {
  const seen = new Set<string>();
  const out: RecommendationBlock[] = [];

  for (const block of blocks) {
    const items: RecommendationItem[] = [];
    for (const it of block.items) {
      const key = `${it.kind}:${it.id}`;
      if (seen.has(key)) continue;
      seen.add(key);
      items.push(it);
    }
    if (items.length === 0) continue;
    out.push({ ...block, items });
  }
  return out;
}

/** If the same strategy appears twice (e.g. duplicate rails), keep the first block only. */
export function dedupeStrategies(blocks: RecommendationBlock[]): RecommendationBlock[] {
  const seen = new Set<RecommendationStrategy>();
  const out: RecommendationBlock[] = [];
  for (const b of blocks) {
    if (seen.has(b.strategy)) continue;
    seen.add(b.strategy);
    out.push(b);
  }
  return out;
}

/**
 * Light diversity: avoid back-to-back sections with identical titles (after dedupe).
 * Uses strategy keys when titles collide so copy stays scannable.
 */
export function diversifySectionTitles(blocks: RecommendationBlock[]): RecommendationBlock[] {
  if (blocks.length <= 1) return blocks;
  const out: RecommendationBlock[] = [];
  let prevTitle: string | null = null;
  let prevStrategy: RecommendationStrategy | null = null;
  for (const b of blocks) {
    let title = b.title;
    if (prevTitle && title === prevTitle) {
      const tag =
        b.strategy === prevStrategy ?
          "More picks"
        : b.strategy === "trending_now" ? "Trending"
        : b.strategy === "price_drop_opportunities" ? "Updates"
        : b.strategy === "because_you_saved" ? "Saved-inspired"
        : "More options";
      title = `${title} · ${tag}`;
    }
    prevTitle = title;
    prevStrategy = b.strategy;
    out.push({ ...b, title });
  }
  return out;
}

/**
 * Drops very thin sections (reduces repetitive 1-card rows) while keeping at least one block when possible.
 */
export function dropAnemicBlocks(blocks: RecommendationBlock[], minItems: number): RecommendationBlock[] {
  if (blocks.length <= 1) return blocks;
  const kept = blocks.filter((b, i) => b.items.length >= minItems || i === 0);
  return kept.length > 0 ? kept : [blocks[0]!].filter(Boolean);
}
