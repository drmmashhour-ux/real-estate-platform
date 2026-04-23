import { apiFetch } from "./api";

export type MobileListingCard = {
  id: string;
  title: string;
  city: string;
  priceCents: number;
  imageUrl: string | null;
  beds: number | null;
  baths: number | null;
};

export type MobileListingsResponse = {
  listings: MobileListingCard[];
};

export async function fetchListings(): Promise<MobileListingsResponse> {
  return apiFetch<MobileListingsResponse>("/api/mobile/listings");
}

export type MobileListingDetail = {
  id: string;
  title: string;
  description: string | null;
  city: string;
  address: string | null;
  priceCents: number;
  imageUrl: string | null;
  gallery: string[];
  beds: number | null;
  baths: number | null;
  status: string;
};

export async function fetchListingById(id: string): Promise<MobileListingDetail> {
  return apiFetch<MobileListingDetail>(`/api/mobile/listings/${encodeURIComponent(id)}`);
}
