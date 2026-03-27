/**
 * Event router – register consumers per event type and dispatch.
 */

import type { EventConsumer } from "./types";
import type { StoredPlatformEvent } from "./types";

const consumersByType = new Map<string, Set<EventConsumer>>();

export function subscribe(eventType: string, consumer: EventConsumer): () => void {
  let set = consumersByType.get(eventType);
  if (!set) {
    set = new Set();
    consumersByType.set(eventType, set);
  }
  set.add(consumer);
  return () => set!.delete(consumer);
}

export function subscribeMany(eventTypes: string[], consumer: EventConsumer): () => void {
  const unsubs = eventTypes.map((t) => subscribe(t, consumer));
  return () => unsubs.forEach((u) => u());
}

export function getConsumersFor(eventType: string): EventConsumer[] {
  const set = consumersByType.get(eventType);
  if (!set) return [];
  return Array.from(set);
}

export function getConsumersForWildcard(pattern: string): EventConsumer[] {
  const all: EventConsumer[] = [];
  for (const [type, set] of consumersByType) {
    if (pattern === "*" || type === pattern || type.startsWith(pattern.replace("*", ""))) {
      set.forEach((c) => all.push(c));
    }
  }
  return all;
}

export async function dispatchToConsumers(event: StoredPlatformEvent): Promise<{ ok: number; failed: number }> {
  const consumers = [
    ...getConsumersFor(event.eventType),
    ...getConsumersFor("*"),
  ];
  let ok = 0;
  let failed = 0;
  for (const consumer of consumers) {
    try {
      await Promise.resolve(consumer(event));
      ok++;
    } catch (e) {
      failed++;
    }
  }
  return { ok, failed };
}
