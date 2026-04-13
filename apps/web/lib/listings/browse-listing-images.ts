/**
 * Public browse (`/api/buyer/browse`) — ensure every row has a displayable hero image.
 * CRM `Listing` rows have no photo columns; FSBO rows may be incomplete in dev.
 */

const PLACEHOLDER_IMAGES = [
  "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1200&q=80&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=1200&q=80&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=1200&q=80&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?w=1200&q=80&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1600573472592-401b489a3cdc?w=1200&q=80&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=1200&q=80&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=1200&q=80&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1600585154084-4e5fe7c39198?w=1200&q=80&auto=format&fit=crop",
] as const;

/** Stable Unsplash URL per listing id (same id → same image). */
export function publicBrowsePlaceholderImage(stableKey: string): string {
  let h = 0;
  for (let i = 0; i < stableKey.length; i++) h = (Math.imul(31, h) + stableKey.charCodeAt(i)) | 0;
  const idx = Math.abs(h) % PLACEHOLDER_IMAGES.length;
  return PLACEHOLDER_IMAGES[idx] ?? PLACEHOLDER_IMAGES[0];
}

export function resolvedBrowseCoverAndImages(input: {
  id: string;
  coverImage: string | null;
  images: string[];
}): { coverImage: string; images: string[] } {
  const trimmedCover = input.coverImage?.trim() ?? "";
  const imgs = (Array.isArray(input.images) ? input.images : [])
    .map((u) => (typeof u === "string" ? u.trim() : ""))
    .filter(Boolean);

  if (trimmedCover) {
    return {
      coverImage: trimmedCover,
      images: imgs.length > 0 ? imgs : [trimmedCover],
    };
  }
  if (imgs.length > 0) {
    return { coverImage: imgs[0]!, images: imgs };
  }
  const ph = publicBrowsePlaceholderImage(input.id);
  return { coverImage: ph, images: [ph] };
}
