/** Query + cookie attribution for Centris syndicated traffic (non-PII routing hints). */

export type CentrisChannelHint = "CENTRIS" | "LECIPM";

export function resolveCentrisFromSearchParams(searchParams: {
  dist?: string | string[];
  src?: string | string[];
}): CentrisChannelHint {
  const dist = Array.isArray(searchParams.dist) ? searchParams.dist[0] : searchParams.dist;
  const src = Array.isArray(searchParams.src) ? searchParams.src[0] : searchParams.src;
  const d = typeof dist === "string" && dist.toLowerCase() === "centris";
  const s = typeof src === "string" && src.toLowerCase() === "centris";
  return d || s ? "CENTRIS" : "LECIPM";
}

export const CENTRIS_ATTRIBUTION_COOKIE = "lecipm_centris_src";
