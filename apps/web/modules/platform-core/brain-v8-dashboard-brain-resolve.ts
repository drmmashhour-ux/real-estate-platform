/**
 * Opt-in Brain V8 presentation envelope for platform dashboard payloads.
 * Legacy loaders must not import this — use {@link buildBrainSnapshot} only from {@link platform-history.service}.
 */
import { platformCoreFlags } from "@/config/feature-flags";
import { logInfo } from "@/lib/logger";
import { buildBrainSnapshot } from "./brain-snapshot.service";
import { buildBrainOutputWithV8Routing } from "./brain-v8-primary-routing.service";
import type { BrainSnapshotPayload } from "./brain-snapshot.service";
import type { BrainSnapshotWithV8Influence } from "./brain-v8-influence.service";

const NS = "[brain:v8:parallel-entry]";

export type DashboardBrainPresentationMode = "legacy_snapshot" | "v8_overlay";

/**
 * Resolves the brain slice for `loadPlatformCoreDashboardPayload` variants.
 * - `legacy_snapshot`: raw {@link buildBrainSnapshot} only (no Phase C/D routing, stable reference from builder).
 * - `v8_overlay`: opt-in — runs {@link buildBrainOutputWithV8Routing} after snapshot build.
 */
export async function resolveDashboardBrainPayload(
  mode: DashboardBrainPresentationMode,
): Promise<BrainSnapshotPayload | BrainSnapshotWithV8Influence | null> {
  if (!platformCoreFlags.platformCoreV1) {
    return null;
  }
  const snapshot = await buildBrainSnapshot();
  if (mode === "legacy_snapshot") {
    logInfo(NS, { event: "dashboard_brain", path: "legacy_snapshot", overlayApplied: false });
    return snapshot;
  }
  logInfo(NS, {
    event: "dashboard_brain",
    path: "v8_overlay",
    routing: "buildBrainOutputWithV8Routing",
  });
  return buildBrainOutputWithV8Routing(snapshot);
}
