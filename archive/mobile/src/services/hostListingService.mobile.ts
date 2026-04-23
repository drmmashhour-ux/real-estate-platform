import { mobileFetch } from "./apiClient";

export const getHostListings = () => mobileFetch<{ listings: unknown[] }>("/api/mobile/v1/host/listings");

export const updateListingBasics = async (_id: string, _data: object) =>
  Promise.reject(new Error("Add authenticated PATCH /api/mobile/v1/host/listings/[id]"));

export const updateAmenities = updateListingBasics;
export const updateCheckinRules = updateListingBasics;
export const updateCheckoutRules = updateListingBasics;
export const updatePhotos = async (_id: string, _urls: string[]) =>
  Promise.reject(new Error("Signed URL upload pipeline"));

export const getListingQualitySummary = (listingId: string) =>
  getHostListings().then((r) => {
    const listings = (r as { listings: Array<{ id: string } & Record<string, unknown>> }).listings;
    return listings.find((l) => l.id === listingId);
  });
