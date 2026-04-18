/**
 * Bounded negotiation hints — not legal advice; parties must confirm any offer in writing.
 */

export type OfferBounds = {
  listPriceCents: number;
  medianPeerCents: number | null;
  peerSampleSize: number;
};

export function suggestInitialOfferRange(bounds: OfferBounds): { lowCents: number; midCents: number; highCents: number } {
  const list = bounds.listPriceCents;
  const anchor = bounds.medianPeerCents && bounds.medianPeerCents > 0 ? (list + bounds.medianPeerCents) / 2 : list;
  const lowCents = Math.round(anchor * 0.94);
  const midCents = Math.round(anchor * 0.97);
  const highCents = Math.round(anchor * 0.995);
  return { lowCents, midCents, highCents };
}

export function suggestCounterRange(currentOfferCents: number, listPriceCents: number): { minCents: number; maxCents: number } {
  const gap = listPriceCents - currentOfferCents;
  const step = Math.max(500_00, Math.round(gap * 0.35));
  return {
    minCents: Math.min(listPriceCents, currentOfferCents + step),
    maxCents: Math.min(listPriceCents, currentOfferCents + Math.round(step * 1.4)),
  };
}
