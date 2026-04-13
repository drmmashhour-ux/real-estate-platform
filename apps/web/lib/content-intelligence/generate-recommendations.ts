import { ContentMachineStyle } from "@prisma/client";
import type { ExtendedOptimizationSignals } from "./types";

const ALL_STYLES: ContentMachineStyle[] = [
  ContentMachineStyle.price_shock,
  ContentMachineStyle.lifestyle,
  ContentMachineStyle.comparison,
  ContentMachineStyle.question,
  ContentMachineStyle.hidden_gem,
];

/**
 * Human-readable recommendations for ops + prompt biasing (not shown to end users verbatim in UI unless reviewed).
 */
export function generateContentRecommendations(
  sig: ExtendedOptimizationSignals | null,
  opts?: {
    /** When set, bias copy toward price-led angles for “budget” stays. */
    nightPriceCents?: number;
    /** e.g. montreal — matched against `cityStyleHints` */
    city?: string;
  }
): string[] {
  if (!sig || sig.totalPieces < 5) {
    return [
      "Not enough labeled performance data yet. Sync social metrics and attributed bookings, then refresh scores.",
    ];
  }

  const lines: string[] = [];
  const top = sig.stylesRanked[0];
  const second = sig.stylesRanked[1];
  if (top) {
    lines.push(
      `Winning content angle right now: **${top.style}** (≈${top.count} pieces in top cohort; aggregate score contribution).`,
    );
  }
  if (second && top && second.style !== top.style) {
    lines.push(`Runner-up style for diversity: **${second.style}** — keep rotating for exploration.`);
  }

  const urgent = sig.ctaBuckets.find((c) => c.bucket === "urgency");
  const book = sig.ctaBuckets.find((c) => c.bucket === "book_reserve");
  if (urgent && book && urgent.scoreSum > book.scoreSum * 0.9) {
    lines.push("CTA pattern: urgency/time-bound language is competing with direct “book” — test both but lean into what your cohort shows.");
  } else if (urgent && urgent.scoreSum >= (sig.ctaBuckets[0]?.scoreSum ?? 0) * 0.85) {
    lines.push("Strong signal for **urgency / scarcity** CTAs in top cohort.");
  }

  const hero = sig.visualOrderStats.find((v) => v.key === "hero_first");
  if (hero && hero.count >= 3 && hero.avgScore >= (sig.visualOrderStats[1]?.avgScore ?? 0)) {
    lines.push("Visuals: **hero / cover image first** in the edit order correlates with higher scores in winners.");
  }

  const price = opts?.nightPriceCents;
  if (price != null && price > 0 && price < 12000 && top?.style === ContentMachineStyle.price_shock) {
    lines.push("For **low nightly price** listings, **price_shock** hooks are aligned with current winners — keep price truthful.");
  }

  const cityKey = opts?.city?.trim().toLowerCase().replace(/\s+/g, "_");
  if (cityKey) {
    const row = sig.cityStyleHints.find((c) => c.cityKey === cityKey);
    if (row) {
      lines.push(
        `For **${opts!.city}**, top cohort skews toward **${row.topStyle}** (${row.pieces} winning samples).`,
      );
    }
  }

  if (sig.worstHookExamples.length) {
    lines.push(
      `Avoid repeating weak hook patterns like: “${sig.worstHookExamples[0]!.slice(0, 80)}…” (from bottom cohort).`,
    );
  }

  lines.push(
    `Exploration: keep ~20% of generations intentionally diverse (non-top styles) so the model does not collapse to one template.`,
  );

  return lines;
}

export function styleBiasWeights(
  sig: ExtendedOptimizationSignals | null,
  explorationRate = 0.22
): Record<ContentMachineStyle, number> {
  const base = 1 / ALL_STYLES.length;
  const weights = Object.fromEntries(ALL_STYLES.map((s) => [s, base])) as Record<ContentMachineStyle, number>;
  if (!sig?.stylesRanked.length) return weights;

  const ranked = [...sig.stylesRanked].sort((a, b) => b.scoreSum - a.scoreSum);
  let i = 0;
  for (const r of ranked) {
    const bump = (ranked.length - i) * 0.04;
    weights[r.style] = (weights[r.style] ?? base) + bump;
    i += 1;
  }

  if (Math.random() < explorationRate) {
    const pick = ALL_STYLES[Math.floor(Math.random() * ALL_STYLES.length)]!;
    weights[pick] = (weights[pick] ?? base) + 0.15;
  }

  const sum = ALL_STYLES.reduce((s, st) => s + (weights[st] ?? 0), 0) || 1;
  for (const st of ALL_STYLES) {
    weights[st] = (weights[st] ?? base) / sum;
  }
  return weights;
}
