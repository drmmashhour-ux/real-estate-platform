/**
 * Helpers for FSBO bundled uploads (`fsbo/{listingId}/{assetId}/…`).
 */

/** Returns the first path segment after `/fsbo/{listingId}/` (asset folder id). */
export function parseFsboBundledAssetId(imageUrl: string, listingId: string): string | null {
  const marker = `/fsbo/${listingId}/`;
  const i = imageUrl.indexOf(marker);
  if (i === -1) return null;
  const rest = imageUrl.slice(i + marker.length).split(/[?#]/)[0] ?? "";
  const seg = rest.split("/").filter(Boolean);
  if (seg.length < 2) return null;
  return seg[0] ?? null;
}

/** Same folder as any variant URL (strip filename). */
export function fsboImageFolderUrl(imageUrl: string): string {
  const q = imageUrl.split(/[?#]/)[0] ?? imageUrl;
  const slash = q.lastIndexOf("/");
  return slash === -1 ? q : q.slice(0, slash);
}
