/**
 * Optional persistence hook — additive; no Prisma coupling in V1 (log-only stub).
 */
import { logInfo } from "@/lib/logger";
import { globalFusionFlags } from "@/config/feature-flags";
import type { GlobalFusionPayload } from "./global-fusion.types";

const NS = "[global:fusion]";

/** When persistence flag is on, emit a compact audit log for future storage backends. Does not write DB rows. */
export function maybeLogGlobalFusionPersistenceStub(payload: GlobalFusionPayload): boolean {
  if (!globalFusionFlags.globalFusionPersistenceV1 || !payload.enabled || !payload.snapshot) {
    return false;
  }
  logInfo(NS, {
    event: "persistence_stub",
    note: "FEATURE_GLOBAL_FUSION_PERSISTENCE_V1 — structured log only; no fusion table yet",
    conflicts: payload.snapshot.conflicts.length,
    recommendations: payload.snapshot.recommendations.length,
    scores: payload.snapshot.scores,
  });
  return true;
}
