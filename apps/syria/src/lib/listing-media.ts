/** First image URL from SyriaProperty.images JSON array. */
export function firstImageUrl(images: unknown): string | null {
  if (!Array.isArray(images)) return null;
  const first = images.find((x): x is string => typeof x === "string" && x.length > 0);
  return first ?? null;
}
