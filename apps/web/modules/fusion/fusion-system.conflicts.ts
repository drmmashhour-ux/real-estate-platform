/**
 * Cross-system conflict detection (advisory only; no enforcement).
 */
import type { FusionConflict, FusionNormalizedSignal } from "./fusion-system.types";
import type { FusionRawGather } from "./fusion-system.gather";

function cid(cat: string, key: string): string {
  return `${cat}:${key}`.slice(0, 200);
}

export function detectFusionConflicts(signals: FusionNormalizedSignal[], raw: FusionRawGather): FusionConflict[] {
  const conflicts: FusionConflict[] = [];

  const brainTrust = avg(signals.filter((s) => s.source === "brain" && s.trust != null).map((s) => s.trust as number));
  const adsRisk = avg(signals.filter((s) => s.source === "ads" && s.risk != null).map((s) => s.risk as number));
  if (brainTrust > 0.72 && adsRisk > 0.55) {
    conflicts.push({
      id: cid("brain_ads", "trust_vs_risk"),
      systems: ["brain", "ads"],
      severity: "medium",
      category: "trust_vs_ads_risk",
      reason: "Brain trust signals are strong while Ads autopilot shows elevated risk (e.g. primary fallback pressure).",
      recommendation: "caution",
    });
  }

  const opByTarget = new Map<string, FusionNormalizedSignal[]>();
  for (const s of signals.filter((x) => x.source === "operator" && x.entityRef?.id)) {
    const k = `${s.entityRef?.type}|${s.entityRef?.id}`;
    const arr = opByTarget.get(k) ?? [];
    arr.push(s);
    opByTarget.set(k, arr);
  }
  for (const [k, rows] of opByTarget) {
    if (rows.length > 1) {
      const pri = rows.map((r) => r.priority ?? 0.5);
      const spread = Math.max(...pri) - Math.min(...pri);
      if (spread > 0.35) {
        conflicts.push({
          id: cid("operator_dup", k),
          systems: ["operator"],
          severity: "low",
          category: "competing_operator_targets",
          reason: `Multiple operator recommendations on same target with divergent priority (${k}).`,
          recommendation: "monitor",
          entityRef: rows[0].entityRef,
        });
      }
    }
  }

  const blocked = signals.filter((s) => {
    if (s.source !== "platform_core") return false;
    const st = (s.metadata as { status?: string } | undefined)?.status;
    return st === "BLOCKED";
  });
  const executeHints = signals.filter(
    (s) =>
      s.source === "operator" &&
      (s.advisoryActionType === "EXECUTE" ||
        (typeof s.advisoryActionType === "string" && s.advisoryActionType.includes("SCALE"))),
  );
  for (const e of executeHints) {
    const ent = e.entityRef?.id;
    if (!ent) continue;
    const block = blocked.find(
      (b) => b.entityRef?.id && String(b.entityRef.id) === String(ent) && (b.risk ?? 0) > 0.7,
    );
    if (block) {
      conflicts.push({
        id: cid("exec_vs_block", `${ent}`),
        systems: ["operator", "platform_core"],
        severity: "high",
        category: "execute_vs_platform_blocked",
        reason: "Operator-style action intent while Platform Core shows blocked/high-risk decision on same entity.",
        recommendation: "defer",
        entityRef: e.entityRef,
      });
    }
  }

  const a = raw.adsMonitoring;
  if (a && a.v8PrimaryFallbackCount > 2 && a.shadowPipelineFailures > 1) {
    conflicts.push({
      id: cid("ads", "pipeline_stress"),
      systems: ["ads"],
      severity: "medium",
      category: "ads_pipeline_stress",
      reason: "Ads V8 primary fallbacks and shadow pipeline failures co-occurring.",
      recommendation: "monitor",
    });
  }

  if (raw.brainV8Monitoring && raw.brainV8Monitoring.consecutiveEmptyPasses > 5 && signals.length > 10) {
    conflicts.push({
      id: cid("brain", "empty_vs_signals"),
      systems: ["brain"],
      severity: "low",
      category: "brain_empty_sample_vs_data",
      reason: "Brain shadow shows repeated empty samples while other subsystems produced signals — verify observation cadence.",
      recommendation: "monitor",
    });
  }

  const brainTrustHigh = avg(signals.filter((s) => s.source === "brain" && s.trust != null).map((s) => s.trust as number));
  const brainStabilityLow =
    signals.some(
      (s) =>
        s.source === "brain" &&
        s.kind === "decision_outcome" &&
        typeof s.metadata?.outcomeType === "string" &&
        s.metadata.outcomeType === "INSUFFICIENT_DATA",
    ) || (raw.brainV8Monitoring?.consecutiveEmptyPasses ?? 0) > 3;
  if (brainTrustHigh > 0.78 && brainStabilityLow) {
    conflicts.push({
      id: cid("brain", "trust_vs_stability"),
      systems: ["brain"],
      severity: "low",
      category: "brain_trust_vs_comparison_stability",
      reason: "Brain trust reads strong but outcome/observation stability looks thin — treat comparison signals as fragile.",
      recommendation: "caution",
    });
  }

  const adsConfidentLowRisk = signals.filter(
    (s) => s.source === "ads" && (s.confidence ?? 0) > 0.7 && (s.risk ?? 1) < 0.38,
  );
  const platformNeedsAttention = signals.filter((s) => {
    if (s.source !== "platform_core") return false;
    const st = (s.metadata as { status?: string } | undefined)?.status;
    return st === "MONITORING" || st === "PENDING";
  });
  if (adsConfidentLowRisk.length && platformNeedsAttention.length >= 3) {
    conflicts.push({
      id: cid("ads_pc", "scale_vs_backlog"),
      systems: ["ads", "platform_core"],
      severity: "medium",
      category: "ads_momentum_vs_platform_queue",
      reason: "Ads layer looks healthy while several Platform Core decisions remain pending/monitoring — scheduler or dependency backlog possible.",
      recommendation: "caution",
    });
  }

  return conflicts;
}

function avg(xs: number[]): number {
  if (!xs.length) return 0;
  return xs.reduce((a, b) => a + b, 0) / xs.length;
}
