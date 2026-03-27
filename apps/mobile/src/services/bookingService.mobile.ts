import { mobileFetch } from "./apiClient";

export const getMyBookings = () => mobileFetch<{ bookings: unknown[] }>("/api/mobile/v1/bookings");

export const getBookingDetails = (id: string) => mobileFetch<{ booking: unknown }>(`/api/mobile/v1/bookings/${id}`);

/** Placeholder until `/api/mobile/v1/bookings/quote` exists */
export const getPriceQuote = async (_listingId: string, _payload: object) =>
  Promise.reject(new Error("Quote API not yet exposed — use web checkout or add mobile quote route"));

export const createBookingRequest = async (_payload: object) =>
  Promise.reject(new Error("Use web booking flow until mobile POST is wired"));

export const confirmBooking = async (_payload: object) =>
  Promise.reject(new Error("Use Stripe Checkout from web or add mobile-native payment sheet"));

export const getGuestPaymentSummary = (bookingId: string) => getBookingDetails(bookingId);

export const cancelBooking = async (_bookingId: string) =>
  Promise.reject(new Error("Add mobile cancel with policy checks"));

export const getAvailabilityCalendar = async (_listingId: string) =>
  Promise.reject(new Error("Add aggregation of AvailabilitySlot + bookings for guest date picker"));
