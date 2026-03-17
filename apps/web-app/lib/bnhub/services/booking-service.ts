/**
 * BNHub BookingService — check availability, create/cancel booking, get booking.
 * Delegates to lib/bnhub/booking and lib/bnhub/listings.
 */

import {
  createBooking,
  getBookingById,
  getBookingsForGuest,
  getBookingsForHost,
  confirmBooking,
  approveBooking,
  declineBooking,
  cancelBooking,
  completeBooking,
} from "@/lib/bnhub/booking";
import { isListingAvailable, getAvailability, setAvailability } from "@/lib/bnhub/listings";

export const BookingService = {
  checkAvailability(listingId: string, checkIn: Date, checkOut: Date) {
    return isListingAvailable(listingId, checkIn, checkOut);
  },

  createBooking(data: {
    listingId: string;
    guestId: string;
    checkIn: string;
    checkOut: string;
    guestNotes?: string;
  }) {
    return createBooking(data);
  },

  getBooking(id: string) {
    return getBookingById(id);
  },

  getBookingsForGuest(guestId: string) {
    return getBookingsForGuest(guestId);
  },

  getBookingsForHost(hostId: string) {
    return getBookingsForHost(hostId);
  },

  cancelBooking(bookingId: string, actorId: string, by: "guest" | "host" | "admin") {
    return cancelBooking(bookingId, actorId, by);
  },

  confirmBooking(bookingId: string) {
    return confirmBooking(bookingId);
  },

  approveBooking(bookingId: string, hostId: string) {
    return approveBooking(bookingId, hostId);
  },

  declineBooking(bookingId: string, hostId: string, reason?: string) {
    return declineBooking(bookingId, hostId, reason);
  },

  completeBooking(bookingId: string) {
    return completeBooking(bookingId);
  },

  getAvailability(listingId: string, start: Date, end: Date) {
    return getAvailability(listingId, start, end);
  },

  setAvailability(listingId: string, date: Date, available: boolean) {
    return setAvailability(listingId, date, available);
  },
};
