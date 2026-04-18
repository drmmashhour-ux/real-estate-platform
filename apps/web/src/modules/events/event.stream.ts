import type { GrowthEventPayload } from "./event.types";

/** Hook for Kafka/queue — no-op in app by default. */
export async function emitGrowthEventStream(_e: GrowthEventPayload): Promise<void> {
  if (process.env.NODE_ENV === "development" && process.env.GROWTH_EVENT_STREAM_DEBUG === "1") {
    console.info("[growth-event-stream]", JSON.stringify(_e));
  }
}
