/**
 * Event publisher – publish events to the bus (log + route to consumers).
 */

import { appendEvent } from "./event-log";
import { enqueueForDispatch } from "./queue";
import type { PublishOptions } from "./types";
import type { StoredPlatformEvent } from "./types";

export async function publish(eventType: string, options: PublishOptions): Promise<StoredPlatformEvent> {
  const event = await appendEvent({
    eventType,
    sourceModule: options.sourceModule,
    entityType: options.entityType ?? null,
    entityId: options.entityId ?? null,
    payload: options.payload ?? null,
    region: options.region ?? null,
  });
  enqueueForDispatch(event.id);
  return event;
}

export async function publishMany(
  events: Array<{ eventType: string; options: PublishOptions }>
): Promise<StoredPlatformEvent[]> {
  const result: StoredPlatformEvent[] = [];
  for (const { eventType, options } of events) {
    const event = await publish(eventType, options);
    result.push(event);
  }
  return result;
}
