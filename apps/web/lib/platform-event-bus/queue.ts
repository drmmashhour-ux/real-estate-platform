/**
 * In-process event queue – async dispatch after persist.
 */

import { appendEvent, getPendingEvents, updateProcessingStatus } from "./event-log";
import { dispatchToConsumers } from "./subscriptions";

let processing = false;

function runProcessQueue(): void {
  if (processing) return;
  processing = true;
  processNext()
    .finally(() => {
      processing = false;
    });
}

async function processNext(): Promise<void> {
  const pending = await getPendingEvents(20);
  if (pending.length === 0) return;
  for (const event of pending) {
    try {
      const { ok, failed } = await dispatchToConsumers(event);
      if (failed > 0 && ok === 0) {
        await updateProcessingStatus(event.id, "failed", "All consumers failed");
      } else {
        await updateProcessingStatus(event.id, "processed");
      }
    } catch (e) {
      await updateProcessingStatus(
        event.id,
        "failed",
        e instanceof Error ? e.message : String(e)
      );
    }
  }
  if (pending.length >= 20) setImmediate(runProcessQueue);
}

/**
 * Enqueue event for async consumer dispatch (after it has been stored).
 * Call this after appendEvent in publish flow.
 */
export function enqueueForDispatch(eventId: string): void {
  setImmediate(runProcessQueue);
}

/**
 * Process pending events from the log (e.g. from a worker or cron).
 */
export async function processPendingEvents(limit = 50): Promise<{ processed: number; failed: number }> {
  const pending = await getPendingEvents(limit);
  let processed = 0;
  let failed = 0;
  for (const event of pending) {
    try {
      await dispatchToConsumers(event);
      await updateProcessingStatus(event.id, "processed");
      processed++;
    } catch (e) {
      await updateProcessingStatus(event.id, "failed", e instanceof Error ? e.message : String(e));
      failed++;
    }
  }
  return { processed, failed };
}
