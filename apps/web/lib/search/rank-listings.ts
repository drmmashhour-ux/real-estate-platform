import type { PublicListingRow } from "@/lib/bnhub/public-supabase-listings-read";
import type { ParsedNaturalQuery } from "@/lib/search/natural-language-parse";

export type RankedListing = PublicListingRow & {
  score: number;
  reasons: string[];
};

function norm(s: string): string {
  return s.trim().toLowerCase();
}

/**
 * Deterministic ranking: price fit, city/text match, review proxy (not available per-row in list API — optional pass-in).
 */
export function rankListingsForQuery(
  listings: PublicListingRow[],
  parsed: ParsedNaturalQuery,
  reviewByListingId?: Map<string, { avg: number; count: number }>
): RankedListing[] {
  const q = norm(parsed.queryText);
  const cityFilter = parsed.city ? norm(parsed.city) : null;

  const scored = listings.map((L) => {
    let score = 50;
    const reasons: string[] = [];

    const title = norm(L.title);
    const desc = norm(L.description ?? "");
    const city = norm(L.city ?? "");

    if (cityFilter && city.includes(cityFilter)) {
      score += 25;
      reasons.push("Location match");
    }

    if (parsed.maxPrice != null && L.price_per_night <= parsed.maxPrice) {
      score += 15;
      reasons.push("Matches budget");
    } else if (parsed.maxPrice != null && L.price_per_night > parsed.maxPrice) {
      score -= 10;
    }

    if (parsed.minPrice != null && L.price_per_night >= parsed.minPrice) {
      score += 8;
    }

    if (q.length > 2) {
      const tokens = q.split(/\s+/).filter((t) => t.length > 2);
      let hits = 0;
      for (const t of tokens) {
        if (title.includes(t) || desc.includes(t) || city.includes(t)) hits += 1;
      }
      score += Math.min(20, hits * 4);
      if (hits > 0) reasons.push("Text match");
    }

    const rev = reviewByListingId?.get(L.id);
    if (rev && rev.count > 0) {
      score += Math.min(15, rev.avg * 2);
      if (rev.avg >= 4.2 && rev.count >= 3) reasons.push("Strong reviews");
      else if (rev.avg >= 4) reasons.push("Well rated");
    }

    if (parsed.intent === "investment") {
      if (/\b(invest|yield|roi)\b/i.test(L.description ?? "") || /\b(invest|yield)\b/i.test(L.title)) {
        score += 12;
        reasons.push("Investment signals");
      }
    }

    if (parsed.intent === "stay") {
      score += 5;
      reasons.push("Stay-friendly");
    }

    const uniq = [...new Set(reasons)].slice(0, 4);
    return { ...L, score, reasons: uniq.length ? uniq : ["Listed on BNHub"] };
  });

  scored.sort((a, b) => b.score - a.score);
  return scored;
}
