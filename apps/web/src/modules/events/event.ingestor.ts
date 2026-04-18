import { growthV3Flags } from "@/config/feature-flags";
import type { GrowthEventPayload } from "./event.types";
import { persistGrowthSignalEvent } from "./event.storage";
import { emitGrowthEventStream } from "./event.stream";

export async function ingestGrowthEvent(payload: GrowthEventPayload): Promise<{ id: string } | null> {
  if (!growthV3Flags.growthSignalStreamV1) return null;
  const { id } = await persistGrowthSignalEvent(payload);
  await emitGrowthEventStream(payload);
  return { id };
}
