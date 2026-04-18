"use server";

import { oneBrainV8Flags, platformCoreFlags } from "@/config/feature-flags";
import { requireAdminSession } from "@/lib/admin/require-admin";
import { runBrainV8ShadowObservationPass } from "@/modules/platform-core/brain-v8-shadow-observer.service";

/**
 * Admin-only: triggers read-only Brain V8 shadow observation (no learning/outcome mutations).
 */
export async function runBrainV8ShadowObservationAction() {
  if (!platformCoreFlags.platformCoreV1) {
    throw new Error("Platform core is disabled.");
  }
  const s = await requireAdminSession();
  if (!s.ok) throw new Error(s.error);
  if (!oneBrainV8Flags.brainV8ShadowObservationV1) {
    throw new Error("Brain V8 shadow observation is disabled (FEATURE_BRAIN_V8_SHADOW_OBSERVATION_V1).");
  }
  return runBrainV8ShadowObservationPass();
}
