import { mobileFetch } from "./apiClient";

export const getHostCalendar = (listingId?: string) => {
  const q = listingId ? `?listingId=${encodeURIComponent(listingId)}` : "";
  return mobileFetch<unknown>(`/api/mobile/v1/host/calendar${q}`);
};

export const blockDates = async (_payload: object) =>
  Promise.reject(new Error("Add PATCH availability / blocked day API for mobile"));

export const unblockDates = async (_payload: object) => Promise.reject(new Error("Same as blockDates"));

export const getReservationConflicts = async () => Promise.reject(new Error("Server-side conflict detector"));

export const updateAvailabilityRules = async (_payload: object) =>
  Promise.reject(new Error("Wire to AvailabilityRule model when exposed"));
