"use client";

export type ResultsAbVariant = {
  /** Maximum residences shown when AI ranking is active */
  maxResults: 3 | 5;
  /** Primary CTA label on cards */
  ctaLabel: "Request a visit" | "See this place";
  /** Hero badge wording */
  bestBadge: "Best match" | "Top pick for you";
};

/**
 * Reads optional A/B flags from URL (?sl_ab=voice|tap, sl_n=3|5, sl_cta=visit|see, sl_badge=best|top).
 */
export function readSeniorResultsAb(searchParams: URLSearchParams): ResultsAbVariant {
  const nRaw = searchParams.get("sl_n");
  const maxResults: 3 | 5 = nRaw === "3" ? 3 : 5;

  const ctaRaw = searchParams.get("sl_cta");
  const ctaLabel: ResultsAbVariant["ctaLabel"] =
    ctaRaw === "see" ? "See this place" : "Request a visit";

  const badgeRaw = searchParams.get("sl_badge");
  const bestBadge: ResultsAbVariant["bestBadge"] =
    badgeRaw === "top" ? "Top pick for you" : "Best match";

  return { maxResults, ctaLabel, bestBadge };
}
