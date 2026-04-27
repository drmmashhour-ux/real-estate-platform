/**
 * In-process `on` / `emit` (see `registerEventListeners` in `events/listeners.ts` for
 * `booking.created` → listing agent + performance + `ListingOptimization` pipeline).
 */
import { registerEventListeners } from "./events/listeners";
import { logEvent } from "./events-log";

export type EventHandler = (payload: Record<string, unknown>) => Promise<void> | void;

const handlers: Record<string, EventHandler[]> = {};

export function on(event: string, handler: EventHandler) {
  if (!handlers[event]) {
    handlers[event] = [];
  }
  handlers[event]!.push(handler);
}

/**
 * Persists to `event_logs` first, then in-process fan-out. For heavy work, have handlers queue jobs / `waitUntil` instead of blocking.
 */
export async function emit(
  event: string,
  payload: Record<string, unknown>
): Promise<void> {
  try {
    await logEvent(event, payload);
  } catch (err) {
    console.error("[emit] logEvent failed", event, err);
  }
  if (event === "booking.created") {
    console.log("[EVENT]", {
      type: event,
      listingId: payload.listingId,
      bookingId: payload.bookingId,
      time: new Date().toISOString(),
    });
  }
  const list = handlers[event];
  if (!list?.length) return;
  for (const handler of list) {
    await handler(payload);
  }
}

registerEventListeners(on);
