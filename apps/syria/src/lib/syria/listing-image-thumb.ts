/**
 * Downscale listing image URLs for Lite Mode (≈300px wide, Cloudinary-aware).
 * Non-Cloudinary URLs are returned unchanged — layout/CSS still constrains display size.
 */

export function syriaListingThumbUrl(src: string, maxWidth = 300): string {
  const s = src.trim();
  const marker = "/image/upload/";
  const pos = s.indexOf(marker);
  if (pos === -1) return s;

  const restWithQuery = s.slice(pos + marker.length);
  const qIdx = restWithQuery.indexOf("?");
  const pathOnly = qIdx >= 0 ? restWithQuery.slice(0, qIdx) : restWithQuery;
  if (/\bw_\d+\b/.test(pathOnly)) return s;

  const mw = Math.min(Math.max(64, maxWidth), 400);
  const transform = `w_${mw},c_limit,q_auto,f_auto`;
  return `${s.slice(0, pos + marker.length)}${transform}/${restWithQuery}`;
}
