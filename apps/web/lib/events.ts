import { registerEventListeners } from "./events/listeners";

export type EventHandler = (payload: Record<string, unknown>) => Promise<void> | void;

const handlers: Record<string, EventHandler[]> = {};

export function on(event: string, handler: EventHandler) {
  if (!handlers[event]) {
    handlers[event] = [];
  }
  handlers[event]!.push(handler);
}

/**
 * Synchronous event fan-out (in-process). For heavy work, have handlers queue jobs / `waitUntil` instead of blocking.
 */
export async function emit(
  event: string,
  payload: Record<string, unknown>
): Promise<void> {
  const list = handlers[event];
  if (!list?.length) return;
  for (const handler of list) {
    await handler(payload);
  }
}

registerEventListeners(on);
