/**
 * Advisory-only fusion recommendations (never auto-execute).
 */
import type {
  FusionAdvisoryKind,
  FusionComparisonSummary,
  FusionConflict,
  FusionNormalizedSignal,
  FusionRecommendation,
  FusionScore,
} from "./fusion-system.types";

export function buildFusionComparisonSummary(signals: FusionNormalizedSignal[]): FusionComparisonSummary {
  const byEntity = new Map<string, FusionNormalizedSignal[]>();
  for (const s of signals) {
    if (!s.entityRef?.id) continue;
    const k = `${s.source}|${s.entityRef.type}|${s.entityRef.id}`;
    const arr = byEntity.get(k) ?? [];
    arr.push(s);
    byEntity.set(k, arr);
  }
  let overlapEntityCount = 0;
  let divergentPriorityCount = 0;
  for (const [, rows] of byEntity) {
    if (rows.length > 1) overlapEntityCount++;
    const pri = rows.map((r) => r.priority ?? 0.5);
    if (pri.length > 1 && Math.max(...pri) - Math.min(...pri) > 0.25) divergentPriorityCount++;
  }
  return {
    overlapEntityCount,
    divergentPriorityCount,
    notes: overlapEntityCount ? [`${overlapEntityCount} entity keys with multiple fused signals`] : [],
  };
}

export function buildFusionAdvisoryRecommendations(
  signals: FusionNormalizedSignal[],
  conflicts: FusionConflict[],
  scores: FusionScore,
): FusionRecommendation[] {
  const recs: FusionRecommendation[] = [];

  const systems = new Set(signals.map((s) => s.source));
  const agreeingSystems = [...systems];

  const blocked = conflicts.filter((c) => c.category === "execute_vs_platform_blocked");
  if (blocked.length) {
    recs.push({
      kind: "blocked_by_dependency",
      title: "Defer execution-aligned actions",
      detail: "Platform Core shows blocked decisions overlapping operator-style intent on at least one entity.",
      agreeingSystems: ["platform_core", "operator"],
      disagreeingSystems: [],
      keyRisks: blocked.map((c) => c.reason),
      supportingEvidenceNote: "Fusion conflict detector (advisory only).",
    });
  }

  if (scores.evidenceQuality < 0.35 && signals.length > 5) {
    recs.push({
      kind: "insufficient_evidence",
      title: "Insufficient cross-system evidence quality",
      detail: "Several signals present but average evidence quality is low — prefer monitor-only posture.",
      agreeingSystems,
      disagreeingSystems: [],
      keyRisks: ["low_evidence_quality"],
      supportingEvidenceNote: `evidenceQuality=${scores.evidenceQuality.toFixed(2)}`,
    });
  }

  const high = conflicts.filter((c) => c.severity === "high").length;
  const med = conflicts.filter((c) => c.severity === "medium").length;
  if (!blocked.length && high === 0 && med > 0 && scores.fusedRisk < 0.62) {
    recs.push({
      kind: "proceed_with_caution",
      title: "Proceed with caution",
      detail: "Medium-severity cross-system tensions without hard blocks detected.",
      agreeingSystems,
      disagreeingSystems: [],
      keyRisks: conflicts.filter((c) => c.severity === "medium").map((c) => c.category),
    });
  }

  if (!recs.length && scores.fusedReadiness > 0.62 && scores.fusedRisk < 0.45) {
    recs.push({
      kind: "proceed",
      title: "Advisory: coordinated readiness",
      detail: "Fused readiness and risk are within conservative bounds; still verify operator/platform truth sources.",
      agreeingSystems,
      disagreeingSystems: [],
      keyRisks: [],
    });
  }

  if (!recs.some((r) => r.kind === "monitor_only") && (scores.fusedRisk > 0.55 || high > 0)) {
    recs.push({
      kind: "monitor_only",
      title: "Prefer monitor-only",
      detail: "Elevated fused risk or high-severity conflicts — observe before changing budgets or campaigns.",
      agreeingSystems,
      disagreeingSystems: [],
      keyRisks: conflicts.slice(0, 5).map((c) => c.category),
    });
  }

  return dedupeKinds(recs);
}

function dedupeKinds(recs: FusionRecommendation[]): FusionRecommendation[] {
  const seen = new Set<FusionAdvisoryKind>();
  const out: FusionRecommendation[] = [];
  for (const r of recs) {
    if (seen.has(r.kind)) continue;
    seen.add(r.kind);
    out.push(r);
  }
  return out;
}
