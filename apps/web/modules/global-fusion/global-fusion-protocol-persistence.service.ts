/**
 * Phase H — optional process-local protocol snapshots (no DB; additive).
 */
import { globalFusionFlags } from "@/config/feature-flags";
import type { GlobalFusionOperatingProtocol, GlobalFusionProtocolSnapshot } from "./global-fusion.types";

const MAX = 8;
let ring: GlobalFusionProtocolSnapshot[] = [];

export function maybePersistProtocolSnapshot(protocol: GlobalFusionOperatingProtocol): void {
  if (!globalFusionFlags.globalFusionProtocolFeedV1) return;
  try {
    const snap: GlobalFusionProtocolSnapshot = { generatedAt: protocol.generatedAt, protocol };
    ring.push(snap);
    if (ring.length > MAX) ring.splice(0, ring.length - MAX);
  } catch {
    /* non-blocking */
  }
}

export function getLastProtocolSnapshot(): GlobalFusionProtocolSnapshot | null {
  return ring[ring.length - 1] ?? null;
}

export function resetGlobalFusionProtocolPersistenceForTests(): void {
  ring = [];
}
