/**
 * Street / context evidence from seller photo tags (EXTERIOR | INTERIOR | STREET_VIEW | OTHER).
 */
export function countStreetTaggedPhotos(photoTagsJson: unknown, imageCount: number): number {
  if (!Array.isArray(photoTagsJson) || photoTagsJson.length === 0) return 0;
  let n = 0;
  for (let i = 0; i < Math.min(photoTagsJson.length, imageCount); i++) {
    const t = String(photoTagsJson[i] ?? "").toUpperCase();
    if (t.includes("STREET")) n += 1;
  }
  return n;
}
