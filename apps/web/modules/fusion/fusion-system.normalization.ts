/**
 * Maps subsystem outputs into comparable FusionNormalizedSignal rows (read-only).
 */
import type { FusionNormalizedSignal, FusionSignalSource } from "./fusion-system.types";
import type { FusionRawGather } from "./fusion-system.gather";

function clamp01(n: number): number {
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(1, n));
}

function stableId(source: FusionSignalSource, kind: string, key: string): string {
  return `${source}:${kind}:${key}`.slice(0, 512);
}

/** Does not mutate `raw` inputs. */
export function normalizeFusionSignals(raw: FusionRawGather): FusionNormalizedSignal[] {
  const out: FusionNormalizedSignal[] = [];

  if (raw.brainV8Monitoring) {
    const m = raw.brainV8Monitoring;
    out.push({
      id: stableId("brain", "v8_shadow_monitoring", "aggregate"),
      source: "brain",
      kind: "v8_shadow_monitoring",
      confidence: clamp01(m.passesRun > 0 ? 0.75 : 0.35),
      trust: clamp01(1 - Math.min(0.9, m.snapshotFail * 0.15 + m.auditEmitFail * 0.1)),
      risk: clamp01(Math.min(1, m.consecutiveEmptyPasses * 0.12 + m.snapshotFail * 0.2)),
      evidenceQuality: clamp01(m.passesRun > 0 ? 0.6 : 0.25),
      reasons: [
        `brain_v8_passes=${m.passesRun}`,
        `empty_samples=${m.emptySamplePasses}`,
        `snapshot_fail=${m.snapshotFail}`,
      ],
      advisoryActionType: m.consecutiveEmptyPasses > 4 ? "MONITOR" : "OBSERVE",
      freshnessAt: new Date().toISOString(),
      metadata: { ...m },
    });
  }

  if (raw.brainSnapshot) {
    const snap = raw.brainSnapshot;
    for (let i = 0; i < Math.min(snap.recentOutcomes.length, 20); i++) {
      const o = snap.recentOutcomes[i];
      const conf = typeof o.outcomeScore === "number" ? o.outcomeScore : undefined;
      out.push({
        id: stableId("brain", "outcome", o.id ?? String(i)),
        source: "brain",
        kind: "decision_outcome",
        entityRef: { type: "BRAIN_OUTCOME", id: o.id },
        confidence: conf != null ? clamp01(conf) : undefined,
        trust: conf != null ? clamp01(conf) : 0.4,
        risk: o.outcomeType === "NEGATIVE" ? 0.65 : 0.25,
        evidenceQuality: 0.55,
        reasons: [o.reason ?? "outcome", `type=${o.outcomeType}`],
        provenanceId: o.id,
        freshnessAt: o.createdAt instanceof Date ? o.createdAt.toISOString() : String(o.createdAt),
        metadata: { source: o.source, outcomeType: o.outcomeType },
      });
    }
    if (snap.weights?.length) {
      const w = snap.strongestSources[0];
      if (w) {
        out.push({
          id: stableId("brain", "weight_strongest", w.source),
          source: "brain",
          kind: "source_weight",
          confidence: clamp01(w.weight ?? 0.5),
          trust: clamp01(w.weight ?? 0.5),
          priority: 0.5,
          reasons: [`strongest_source=${w.source}`],
          provenanceId: w.source,
        });
      }
    }
  }

  if (raw.adsMonitoring) {
    const a = raw.adsMonitoring;
    const totalPrimary = a.v8PrimarySuccessCount + a.v8PrimaryFallbackCount;
    const fbRate = totalPrimary > 0 ? a.v8PrimaryFallbackCount / totalPrimary : 0;
    out.push({
      id: stableId("ads", "autopilot_v8_monitoring", "aggregate"),
      source: "ads",
      kind: "ads_autopilot_v8",
      confidence: clamp01(1 - fbRate * 0.8),
      risk: clamp01(fbRate),
      evidenceQuality: clamp01(a.shadowPipelineCompletions > 0 ? 0.55 : 0.35),
      reasons: [
        `adapter_runs=${a.totalRuns}`,
        `v8_primary_fallback=${a.v8PrimaryFallbackCount}`,
        `shadow_failures=${a.shadowPipelineFailures}`,
      ],
      advisoryActionType: fbRate > 0.45 ? "MONITOR" : "OBSERVE",
      freshnessAt: new Date().toISOString(),
      metadata: { lastPrimaryPath: a.lastPrimaryPathLabel },
    });
  }

  if (raw.operatorRecommendations?.length) {
    for (const r of raw.operatorRecommendations.slice(0, 35)) {
      out.push({
        id: stableId("operator", "recommendation", r.id),
        source: "operator",
        kind: "assistant_recommendation",
        entityRef: { type: "OPERATOR_REC", id: r.targetId },
        confidence: clamp01(r.confidenceScore),
        priority: clamp01(r.confidenceScore),
        risk: r.blockers?.length ? 0.55 : 0.25,
        evidenceQuality:
          r.evidenceScore != null ? clamp01(r.evidenceScore / 100) : clamp01((r.confidenceScore ?? 0.5) * 0.9),
        reasons: [r.reason, `action=${r.actionType}`],
        advisoryActionType: r.actionType,
        provenanceId: r.id,
        freshnessAt: r.createdAt,
        metadata: { title: r.title },
      });
    }
  }

  if (raw.platformDecisions?.length) {
    for (const d of raw.platformDecisions.slice(0, 40)) {
      const blocked = d.status === "BLOCKED";
      out.push({
        id: stableId("platform_core", "decision", d.id),
        source: "platform_core",
        kind: "core_decision",
        entityRef: { type: d.entityType, id: d.entityId ?? undefined },
        confidence: clamp01(d.confidenceScore),
        priority: clamp01(d.confidenceScore),
        risk: blocked ? 0.85 : d.status === "FAILED" ? 0.75 : 0.2,
        evidenceQuality:
          d.evidenceScore != null ? clamp01(d.evidenceScore) : clamp01(d.confidenceScore * 0.95),
        reasons: [d.reason, `status=${d.status}`, d.actionType],
        advisoryActionType: d.actionType,
        provenanceId: d.id,
        freshnessAt: d.updatedAt,
        metadata: { title: d.title, blockers: d.blockers, status: d.status },
      });
    }
  }

  return out;
}
