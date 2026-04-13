/**
 * Deterministic A/B split per listing (no cookie). Use for CTA copy / trust experiments.
 */
export function funnelVariantForListing(listingId: string, salt = "cta_v1"): "a" | "b" {
  let h = 0;
  const s = `${salt}:${listingId}`;
  for (let i = 0; i < s.length; i++) {
    h = (h * 31 + s.charCodeAt(i)) | 0;
  }
  return Math.abs(h) % 2 === 0 ? "a" : "b";
}
