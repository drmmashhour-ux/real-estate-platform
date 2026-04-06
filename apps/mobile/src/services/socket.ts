import { io, type Socket } from "socket.io-client";
import { REALTIME_URL } from "../config";
import { getStoredAccessToken } from "./auth";
import { supabase } from "../lib/supabase";

export type BookingSocketPayload = {
  bookingId?: string;
  listingId?: string;
  status?: string;
  hostId?: string;
  guestId?: string;
};

const BOOKING_EVENTS = ["booking_update", "new_booking", "booking_created", "booking_confirmed"] as const;

let socketSingleton: Socket | null = null;

async function resolveToken(): Promise<string | null> {
  const stored = await getStoredAccessToken();
  if (stored) return stored;
  if (!supabase) return null;
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token ?? null;
}

/**
 * Connects to the optional Redis-backed Socket.IO server (`pnpm run realtime:socket` in apps/web).
 */
export async function getLecipmSocket(): Promise<Socket | null> {
  if (!REALTIME_URL) return null;
  const token = await resolveToken();
  if (!token) return null;

  if (socketSingleton?.connected) {
    socketSingleton.auth = { token };
    return socketSingleton;
  }

  if (socketSingleton) {
    socketSingleton.removeAllListeners();
    socketSingleton.disconnect();
    socketSingleton = null;
  }

  const s = io(REALTIME_URL, {
    path: "/socket.io",
    transports: ["websocket", "polling"],
    auth: { token },
    reconnection: true,
    reconnectionAttempts: 8,
  });

  socketSingleton = s;
  return s;
}

export function disconnectLecipmSocket(): void {
  if (socketSingleton) {
    socketSingleton.removeAllListeners();
    socketSingleton.disconnect();
    socketSingleton = null;
  }
}

export function subscribeLecipmBookingEvents(
  handler: (event: (typeof BOOKING_EVENTS)[number], data: BookingSocketPayload) => void
): () => void {
  let active = true;
  let socket: Socket | null = null;

  void (async () => {
    socket = await getLecipmSocket();
    if (!active || !socket) return;
    for (const ev of BOOKING_EVENTS) {
      socket.on(ev, (data: BookingSocketPayload) => {
        handler(ev, data ?? {});
      });
    }
  })();

  return () => {
    active = false;
    if (socket) {
      for (const ev of BOOKING_EVENTS) socket.off(ev);
    }
  };
}
