import type { SybnbRealtimeEvent } from "@/lib/realtime/ws-server";
import { broadcast } from "@/lib/realtime/ws-server";

/** Push SYBNB mutations to connected WebSocket clients (when custom Node server is used). */
export function broadcastSybnbBookingUpdated(bookingId: string, extra?: { status?: string }): void {
  broadcast({ type: "booking_updated", bookingId, ...extra } satisfies SybnbRealtimeEvent);
}

export function broadcastSybnbChatActivity(bookingId: string): void {
  broadcast({ type: "message", bookingId } satisfies SybnbRealtimeEvent);
}
