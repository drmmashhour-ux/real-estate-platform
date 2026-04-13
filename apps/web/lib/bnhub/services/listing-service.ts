/**
 * BNHUB ListingService — create, update, get, delete listings.
 * Delegates to lib/bnhub/listings.
 */

import { prisma } from "@/lib/db";
import {
  createListing,
  updateListing,
  getListingById,
  getListingsByOwner,
  setListingPhotos,
  getListingPhotoUrls,
  type CreateListingData,
  type UpdateListingData,
} from "@/lib/bnhub/listings";

export const ListingService = {
  createListing(data: CreateListingData) {
    return createListing(data);
  },

  updateListing(id: string, data: UpdateListingData) {
    return updateListing(id, data);
  },

  getListing(id: string) {
    return getListingById(id);
  },

  getListingsByHost(hostId: string) {
    return getListingsByOwner(hostId);
  },

  deleteListing(id: string) {
    return prisma.shortTermListing.delete({ where: { id } });
  },

  setPhotos(listingId: string, photos: { url: string; sortOrder?: number; isCover?: boolean }[]) {
    return setListingPhotos(listingId, photos);
  },

  getPhotoUrls(listingId: string) {
    return getListingPhotoUrls(listingId);
  },
};
