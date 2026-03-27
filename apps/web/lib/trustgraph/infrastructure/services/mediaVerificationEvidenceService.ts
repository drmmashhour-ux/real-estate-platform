import { prisma } from "@/lib/db";
import { classifySceneFromPhotoTag } from "@/lib/trustgraph/infrastructure/services/mediaClassificationService";

export async function summarizeMediaClassificationForListing(listingId: string): Promise<{
  exteriorConfidence: number;
  streetConfidence: number;
  documentMismatch: boolean;
}> {
  const listing = await prisma.fsboListing.findUnique({
    where: { id: listingId },
    select: { photoTagsJson: true, images: true },
  });
  if (!listing) {
    return { exteriorConfidence: 0, streetConfidence: 0, documentMismatch: false };
  }
  const images = Array.isArray(listing.images) ? listing.images : [];
  const tags = Array.isArray(listing.photoTagsJson) ? listing.photoTagsJson : [];
  let ext = 0;
  let str = 0;
  let doc = 0;
  for (let i = 0; i < images.length; i++) {
    const t = String(tags[i] ?? "");
    const c = classifySceneFromPhotoTag(t);
    if (c.category === "exterior") ext += c.confidence;
    if (c.category === "street") str += c.confidence;
    if (c.category === "document") doc += 1;
  }
  const n = Math.max(1, images.length);
  return {
    exteriorConfidence: ext / n,
    streetConfidence: str / n,
    documentMismatch: doc > 0 && doc / n > 0.4,
  };
}
