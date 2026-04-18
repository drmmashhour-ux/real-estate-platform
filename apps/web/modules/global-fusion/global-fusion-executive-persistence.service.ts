/**
 * Phase G — optional process-local executive snapshots (no DB; additive; best-effort).
 */
import { globalFusionFlags } from "@/config/feature-flags";
import type { GlobalFusionExecutiveDelta, GlobalFusionExecutiveSnapshot, GlobalFusionExecutiveSummary } from "./global-fusion.types";

const MAX = 12;
let ring: GlobalFusionExecutiveSnapshot[] = [];
let lastOverall: GlobalFusionExecutiveSummary["overallStatus"] | null = null;

export function maybePersistExecutiveSnapshot(summary: GlobalFusionExecutiveSummary): void {
  if (!globalFusionFlags.globalFusionExecutivePersistenceV1) return;
  try {
    const prev = ring[ring.length - 1] ?? null;
    const delta: GlobalFusionExecutiveDelta | null = prev
      ? {
          sinceGeneratedAt: prev.generatedAt,
          prioritiesDelta: summary.topPriorities.length - prev.summary.topPriorities.length,
          risksDelta: summary.topRisks.length - prev.summary.topRisks.length,
          overallStatusChanged: prev.summary.overallStatus !== summary.overallStatus,
        }
      : null;
    const snap: GlobalFusionExecutiveSnapshot = {
      generatedAt: summary.provenance.generatedAt,
      summary,
      deltaHint: delta,
    };
    ring.push(snap);
    if (ring.length > MAX) ring.splice(0, ring.length - MAX);
    lastOverall = summary.overallStatus;
  } catch {
    /* non-blocking */
  }
}

export function getExecutiveSnapshotsForTests(): GlobalFusionExecutiveSnapshot[] {
  return [...ring];
}

export function resetGlobalFusionExecutivePersistenceForTests(): void {
  ring = [];
  lastOverall = null;
}

export function getLastExecutiveSnapshot(): GlobalFusionExecutiveSnapshot | null {
  return ring[ring.length - 1] ?? null;
}

export function getLastOverallStatusHint(): GlobalFusionExecutiveSummary["overallStatus"] | null {
  return lastOverall;
}
