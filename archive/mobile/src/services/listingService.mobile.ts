import { mobileFetch } from "./apiClient";

export const listFeaturedListings = () => mobileFetch<{ listings: unknown[] }>("/api/mobile/v1/listings/featured");

export const searchListings = (params: Record<string, string>) => {
  const q = new URLSearchParams(params);
  return mobileFetch<{ listings: unknown[] }>(`/api/mobile/v1/listings/search?${q}`);
};

export const getListingDetails = (id: string) => mobileFetch<unknown>(`/api/mobile/v1/listings/${id}`);

export const getListingReviews = (id: string) =>
  getListingDetails(id).then((d) => (d as { reviews?: unknown }).reviews ?? []);

export const getSimilarListings = (id: string) =>
  getListingDetails(id).then((d) => (d as { similar?: unknown[] }).similar ?? []);

export const toggleFavorite = (listingId: string, favorited: boolean) =>
  mobileFetch<{ ok: boolean }>("/api/mobile/v1/favorites", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ listingId, favorited }),
  });
