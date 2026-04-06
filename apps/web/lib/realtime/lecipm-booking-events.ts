import { redisPublish } from "@/lib/cache/redis";

export const LECIPM_BOOKING_REDIS_CHANNEL = "lecipm:booking";

export type LecipmBookingRealtimeEvent =
  | "booking_update"
  | "new_booking"
  | "booking_created"
  | "booking_confirmed";

export type LecipmBookingRealtimePayload = {
  event: LecipmBookingRealtimeEvent;
  bookingId: string;
  hostId: string;
  guestId: string;
  listingId?: string;
  status?: string;
};

/** Publishes to Redis for the optional `realtime/socket-booking-server` process (Socket.IO). */
export async function publishLecipmBookingEvent(payload: LecipmBookingRealtimePayload): Promise<void> {
  await redisPublish(LECIPM_BOOKING_REDIS_CHANNEL, JSON.stringify(payload));
}
