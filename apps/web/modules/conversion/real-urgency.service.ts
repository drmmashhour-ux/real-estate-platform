/**
 * Real urgency copy only — no fake countdowns or invented scarcity.
 */

export type RealUrgencyInput = {
  /** ISO date string when listing was last updated */
  listingUpdatedAt?: string | null;
  /** When platform has a real high-intent signal */
  highIntentSignal?: boolean;
  /** Optional bounded demand hint from analytics (only if passed in) */
  recentViewCount?: number | null;
  /** When caller knows verified inventory is limited in this scope */
  verifiedInventoryLimited?: boolean;
};

/**
 * Returns 0–3 short lines; empty when no supported signals.
 */
export function buildRealUrgencySignals(input: RealUrgencyInput): string[] {
  const out: string[] = [];

  if (input.listingUpdatedAt) {
    const t = Date.parse(input.listingUpdatedAt);
    if (Number.isFinite(t)) {
      const days = (Date.now() - t) / (24 * 60 * 60 * 1000);
      if (days >= 0 && days <= 14) {
        out.push("Listing updated recently — details may still be fresh.");
      }
    }
  }

  if (input.highIntentSignal) {
    out.push("High-intent activity recorded for this listing.");
  }

  if (typeof input.recentViewCount === "number" && input.recentViewCount > 0) {
    out.push(`Recent views on this page: ${input.recentViewCount} (session signal).`);
  }

  if (input.verifiedInventoryLimited) {
    out.push("Verified listings in this segment may be few — prioritize the listings that fit your criteria.");
  }

  return out.slice(0, 3);
}
