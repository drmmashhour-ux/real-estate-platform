/**
 * Phase G — company-level risks and blockers from Fusion + monitoring (advisory only).
 */
import type {
  GlobalFusionExecutiveAssemblyInput,
  GlobalFusionExecutiveBlocker,
  GlobalFusionExecutiveRisk,
  GlobalFusionSource,
} from "./global-fusion.types";

let riskSeq = 0;
function nextRiskId(): string {
  riskSeq++;
  return `xr_${riskSeq}`;
}

export function resetGlobalFusionExecutiveRiskSeqForTests(): void {
  riskSeq = 0;
}

function uniqSystems(list: GlobalFusionSource[]): GlobalFusionSource[] {
  return [...new Set(list)];
}

/**
 * Derive ranked executive risks and blockers from assembly inputs.
 */
export function buildExecutiveRisksAndBlockers(input: GlobalFusionExecutiveAssemblyInput): {
  risks: GlobalFusionExecutiveRisk[];
  blockers: GlobalFusionExecutiveBlocker[];
} {
  const risks: GlobalFusionExecutiveRisk[] = [];
  const blockers: GlobalFusionExecutiveBlocker[] = [];
  const m = input.monitoring;
  const snap = input.fusionPayload.snapshot;
  const health = input.fusionPayload.health;
  const gov = input.governanceSnapshot?.status;

  if (m.fallbackRate >= 0.35 && m.runsTotal >= 3) {
    risks.push({
      id: nextRiskId(),
      severity: m.fallbackRate >= 0.5 ? "high" : "medium",
      title: "Elevated Fusion fallback rate",
      summary: `Approximately ${(m.fallbackRate * 100).toFixed(0)}% of recent Fusion runs used primary fallback paths (observational).`,
      sourceSystems: ["brain", "ads", "cro", "ranking"],
      reasons: ["phase_d_fallback_rate"],
      attentionAreas: ["primary_surface_reliability", "input_coverage"],
      freshnessMs: null,
    });
  }

  if (m.missingSourceRate >= 0.4 && m.runsTotal >= 3) {
    risks.push({
      id: nextRiskId(),
      severity: "medium",
      title: "Repeated missing-source conditions",
      summary: `Missing-source rate ~${(m.missingSourceRate * 100).toFixed(0)}% across recent Fusion runs.`,
      sourceSystems: ["brain", "ads", "cro", "ranking"],
      reasons: ["phase_d_missing_sources"],
      attentionAreas: ["control_center_coverage", "evidence_completeness"],
      freshnessMs: null,
    });
  }

  if (m.conflictRate >= 0.38 && m.runsTotal >= 3) {
    risks.push({
      id: nextRiskId(),
      severity: m.conflictRate >= 0.5 ? "high" : "medium",
      title: "Cross-system conflict concentration",
      summary: `Conflict rate ~${(m.conflictRate * 100).toFixed(0)}% — advisory conflicts are frequent.`,
      sourceSystems: ["brain", "ads", "cro", "ranking"],
      reasons: ["phase_d_conflict_rate"],
      attentionAreas: ["governance_review", "alignment"],
      freshnessMs: null,
    });
  }

  if (m.anomalyRate >= 0.28 && m.runsTotal >= 3) {
    risks.push({
      id: nextRiskId(),
      severity: m.anomalyRate >= 0.42 ? "high" : "medium",
      title: "Fusion anomaly signals elevated",
      summary: `Anomaly rate ~${(m.anomalyRate * 100).toFixed(0)}% in Phase D monitoring.`,
      sourceSystems: ["brain", "ads", "cro", "ranking"],
      reasons: ["phase_d_anomaly_rate"],
      attentionAreas: ["stability", "operator_review"],
      freshnessMs: null,
    });
  }

  if (m.lowEvidenceRate >= 0.45 && m.runsTotal >= 3) {
    risks.push({
      id: nextRiskId(),
      severity: "medium",
      title: "Low-evidence dependence",
      summary: `Low-evidence conditions ~${(m.lowEvidenceRate * 100).toFixed(0)}% of recent runs.`,
      sourceSystems: ["brain", "ads", "cro", "ranking"],
      reasons: ["phase_d_low_evidence"],
      attentionAreas: ["evidence_gap", "defer_until_evidence"],
      freshnessMs: null,
    });
  }

  if (m.unstableOrderingRate >= 0.22 && m.runsTotal >= 5) {
    risks.push({
      id: nextRiskId(),
      severity: "medium",
      title: "Unstable prioritization / ordering",
      summary: `Unstable ordering rate ~${(m.unstableOrderingRate * 100).toFixed(0)}% (observational).`,
      sourceSystems: ["brain", "ads", "cro", "ranking"],
      reasons: ["phase_d_unstable_ordering"],
      attentionAreas: ["launch_readiness", "ux_consistency"],
      freshnessMs: null,
    });
  }

  if (gov && (gov.decision === "rollback_recommended" || gov.decision === "require_human_review")) {
    risks.push({
      id: nextRiskId(),
      severity: "high",
      title: `Governance: ${gov.decision}`,
      summary: gov.recommendation,
      sourceSystems: ["brain", "ads", "cro", "ranking"],
      reasons: gov.reasons.slice(0, 6),
      attentionAreas: ["fusion_governance", "human_review"],
      freshnessMs: null,
    });
  }

  if (input.freezeState.learningFrozen || input.freezeState.influenceFrozen) {
    blockers.push({
      id: nextRiskId(),
      title: "Fusion-local freeze active",
      summary: input.freezeState.reason
        ? `Learning ${input.freezeState.learningFrozen ? "frozen" : "ok"} · influence ${input.freezeState.influenceFrozen ? "frozen" : "ok"} — ${input.freezeState.reason}`
        : "Fusion-local adaptive or influence paths are frozen by governance.",
      sourceSystems: ["brain", "ads", "cro", "ranking"],
      dependencies: ["phase_f_governance"],
    });
  }

  if (snap) {
    for (const r of snap.risks.slice(0, 4)) {
      risks.push({
        id: nextRiskId(),
        severity: r.severity,
        title: r.title,
        summary: r.rationale,
        sourceSystems: uniqSystems(r.systems),
        reasons: ["fusion_snapshot_risk"],
        attentionAreas: ["cross_system_advisory"],
        freshnessMs: null,
      });
    }
    for (const c of snap.conflicts.slice(0, 5)) {
      if (blockers.length >= 8) break;
      blockers.push({
        id: nextRiskId(),
        title: c.summary.slice(0, 96),
        summary: c.detail,
        sourceSystems: uniqSystems(c.systems),
        dependencies: [`conflict_${c.recommendation}`],
      });
    }
  }

  if (health.insufficientEvidenceCount > 2 || health.missingSourceCount > 3) {
    blockers.push({
      id: nextRiskId(),
      title: "Evidence / coverage gap",
      summary: `Health reports insufficient evidence (${health.insufficientEvidenceCount}) or missing sources (${health.missingSourceCount}).`,
      sourceSystems: ["brain", "ads", "cro", "ranking"],
      dependencies: ["fusion_health"],
    });
  }

  const learning = input.learning;
  if (learning && learning.insufficientLinkageRate > 0.45 && learning.learningRuns >= 2) {
    risks.push({
      id: nextRiskId(),
      severity: "low",
      title: "Learning linkage weak",
      summary: `Insufficient linkage rate ~${(learning.insufficientLinkageRate * 100).toFixed(0)}% in Phase E (proxy).`,
      sourceSystems: ["brain", "ads", "cro", "ranking"],
      reasons: ["phase_e_linkage"],
      attentionAreas: ["learning_coverage"],
      freshnessMs: null,
    });
  }

  risks.sort((a, b) => sevRank(b.severity) - sevRank(a.severity));
  return {
    risks: risks.slice(0, 10),
    blockers: blockers.slice(0, 8),
  };
}

function sevRank(s: GlobalFusionExecutiveRisk["severity"]): number {
  return s === "high" ? 3 : s === "medium" ? 2 : 1;
}
