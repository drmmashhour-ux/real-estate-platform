import type { FsboListing } from "@prisma/client";

export function listContentNeeds(listing: Pick<FsboListing, "title" | "description" | "images">): string[] {
  const needs: string[] = [];
  const photos = listing.images?.length ?? 0;
  if (photos < 6) needs.push("Add more photos (aim for room-by-room coverage).");
  if ((listing.description ?? "").trim().length < 200) {
    needs.push("Expand description with factual property details already in your files.");
  }
  if ((listing.title ?? "").trim().length < 12) {
    needs.push("Strengthen listing title with property type and neighbourhood (factual).");
  }
  return needs;
}
