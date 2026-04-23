import { apiFetch } from "./api";

export type MobileStayCard = {
  id: string;
  title: string;
  city: string;
  nightPriceCents: number;
  address: string | null;
  lat: number | null;
  lng: number | null;
};

export type MobileStaysResponse = {
  stays: MobileStayCard[];
};

export async function fetchStays(): Promise<MobileStaysResponse> {
  return apiFetch<MobileStaysResponse>("/api/mobile/stays");
}

export type MobileStayDetail = {
  id: string;
  title: string;
  description: string | null;
  city: string;
  address: string | null;
  nightPriceCents: number;
  lat: number | null;
  lng: number | null;
  listingStatus: string;
};

export async function fetchStayById(id: string): Promise<MobileStayDetail> {
  return apiFetch<MobileStayDetail>(`/api/mobile/stays/${encodeURIComponent(id)}`);
}
