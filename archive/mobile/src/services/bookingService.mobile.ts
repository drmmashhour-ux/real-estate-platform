import { API_BASE_URL } from "../lib/env";
import { mobileFetch } from "./apiClient";

export const getMyBookings = () => mobileFetch<{ bookings: unknown[] }>("/api/mobile/v1/bookings");

export const getBookingDetails = (id: string) => mobileFetch<{ booking: unknown }>(`/api/mobile/v1/bookings/${id}`);

export type CreateBookingPayload = { listingId: string; checkIn: string; checkOut: string; guestNotes?: string };

export const createBookingRequest = (payload: CreateBookingPayload) =>
  mobileFetch<{ booking: { id: string; status: string } }>("/api/mobile/v1/bookings", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

/** Uses public web pricing route (same API base). */
export const getPriceQuote = async (listingId: string, checkIn: string, checkOut: string) => {
  const base = API_BASE_URL.replace(/\/$/, "");
  const u = new URL(`${base}/api/bnhub/pricing/breakdown`);
  u.searchParams.set("listingId", listingId);
  u.searchParams.set("checkIn", checkIn);
  u.searchParams.set("checkOut", checkOut);
  const res = await fetch(u.toString(), { headers: { Accept: "application/json" } });
  if (!res.ok) throw new Error(await res.text());
  return res.json() as Promise<{ breakdown: { nights: number; totalCents: number } }>;
};

/** Start Stripe Checkout via `/api/stripe/checkout` (requires Bearer session). */
export const confirmBooking = (_payload: object) =>
  Promise.reject(new Error("Open /payment with bookingId — checkout is started from the payment screen"));

export const getGuestPaymentSummary = (bookingId: string) =>
  mobileFetch<unknown>(`/api/mobile/v1/bookings/${bookingId}/payment-summary`);

export const cancelBooking = async (_bookingId: string) =>
  Promise.reject(new Error("Add mobile cancel with policy checks"));

export const getAvailabilityCalendar = async (_listingId: string) =>
  Promise.reject(new Error("Add aggregation of AvailabilitySlot + bookings for guest date picker"));
