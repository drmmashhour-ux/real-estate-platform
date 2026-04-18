export type ListingImagePick = { url: string; order: number };

/**
 * Picks hero + gallery URLs from real listing payloads only.
 */
export function selectListingImagesForSocial(input: { cover?: string | null; images: string[] }): ListingImagePick[] {
  const out: ListingImagePick[] = [];
  const hero = input.cover?.trim() || (input.images[0] ?? "").trim();
  if (hero) out.push({ url: hero, order: 0 });
  for (let i = 0; i < input.images.length && out.length < 6; i++) {
    const u = input.images[i]!.trim();
    if (!u || u === hero) continue;
    out.push({ url: u, order: i + 1 });
  }
  return out;
}
