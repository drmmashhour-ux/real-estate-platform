/**
 * Fusion System V1 — read-only orchestration entrypoint.
 */
import { fusionSystemFlags, isFusionOrchestrationActive } from "@/config/feature-flags";
import { logInfo } from "@/lib/logger";
import { gatherFusionRawInputs } from "./fusion-system.gather";
import { normalizeFusionSignals } from "./fusion-system.normalization";
import { detectFusionConflicts } from "./fusion-system.conflicts";
import { computeFusionScores } from "./fusion-system.scoring";
import { buildFusionAdvisoryRecommendations, buildFusionComparisonSummary } from "./fusion-system.recommendations";
import { buildFusionHealthSummary } from "./fusion-system.health";
import { buildFusionInfluenceOverlay } from "./fusion-system.influence";
import { persistFusionSnapshotIfEnabled } from "./fusion-system.persistence";
import type { FusionSnapshot } from "./fusion-system.types";

const NS = "[fusion:system]";

export async function buildFusionSnapshotV1(): Promise<FusionSnapshot | null> {
  if (!isFusionOrchestrationActive()) {
    logInfo(NS, { event: "fusion_skipped", reason: "orchestration_inactive" });
    return null;
  }

  const raw = await gatherFusionRawInputs();
  const signals = normalizeFusionSignals(raw);
  const conflicts = detectFusionConflicts(signals, raw);
  const scores = computeFusionScores(signals, conflicts);
  const comparisonSummary = buildFusionComparisonSummary(signals);
  const recommendations = buildFusionAdvisoryRecommendations(signals, conflicts, scores);
  const health = buildFusionHealthSummary(signals, conflicts, recommendations, raw);

  const snapshot: FusionSnapshot = {
    generatedAt: new Date().toISOString(),
    scores,
    signals,
    conflicts,
    recommendations,
    comparisonSummary,
    health,
    influenceOverlay: null,
    persistenceId: null,
  };

  snapshot.influenceOverlay = buildFusionInfluenceOverlay(snapshot);

  if (fusionSystemFlags.fusionSystemPersistenceV1) {
    snapshot.persistenceId = await persistFusionSnapshotIfEnabled(snapshot, health);
  }

  logInfo(NS, {
    event: "fusion_snapshot_built",
    signals: signals.length,
    conflicts: conflicts.length,
    recommendations: recommendations.length,
  });

  return snapshot;
}

export { isFusionOrchestrationActive };
