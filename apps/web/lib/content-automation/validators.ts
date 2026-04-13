import { ListingStatus, type ShortTermListing } from "@prisma/client";
import { assessListingMediaForVideo } from "./rules";

export type PipelineValidationResult = {
  ok: boolean;
  reasons: string[];
  blockVideo: boolean;
  blockPriceShock: boolean;
};

function countListingImages(listing: ShortTermListing & { listingPhotos?: { url: string }[] }): number {
  const fromPhotos = listing.listingPhotos?.length ?? 0;
  let legacy = 0;
  const raw = listing.photos;
  if (Array.isArray(raw)) {
    legacy = raw.filter((u) => typeof u === "string" && u.length > 0).length;
  }
  return Math.max(fromPhotos, legacy);
}

/**
 * Rule engine: block unsafe or low-quality automation.
 */
export function validateListingForContentPipeline(
  listing: ShortTermListing & { listingPhotos?: { url: string }[] },
  opts?: { requirePublishedForSchedule?: boolean }
): PipelineValidationResult {
  const reasons: string[] = [];
  let blockVideo = false;
  let blockPriceShock = false;

  const images = countListingImages(listing);
  const mq = assessListingMediaForVideo(images);
  if (images < 1) {
    reasons.push("At least one listing image is required for social content.");
    blockVideo = true;
  } else if (!mq.sufficientForVideo) {
    blockVideo = true;
  }

  if (!listing.title?.trim()) reasons.push("Listing title is required.");
  if (!listing.city?.trim()) reasons.push("City is required for local social copy.");
  if (!Number.isFinite(listing.nightPriceCents) || listing.nightPriceCents < 100) {
    blockPriceShock = true;
  }

  if (opts?.requirePublishedForSchedule && listing.listingStatus !== ListingStatus.PUBLISHED) {
    reasons.push("Listing must be published before scheduling social posts.");
  }

  const hardFail = reasons.length > 0;

  return {
    ok: !hardFail,
    reasons,
    blockVideo,
    blockPriceShock,
  };
}
