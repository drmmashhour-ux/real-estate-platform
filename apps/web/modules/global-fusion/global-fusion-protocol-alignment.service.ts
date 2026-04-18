/**
 * Phase H — cross-system alignment hints and coordination tensions (advisory only).
 */
import type {
  GlobalFusionExecutiveAssemblyInput,
  GlobalFusionExecutiveSummary,
  GlobalFusionProtocolAlignment,
  GlobalFusionProtocolConflict,
} from "./global-fusion.types";

let alignSeq = 0;
function nextId(prefix: string): string {
  alignSeq++;
  return `${prefix}_${alignSeq}`;
}

export function resetGlobalFusionProtocolAlignmentSeqForTests(): void {
  alignSeq = 0;
}

/**
 * Detect heuristic misalignment / tension between notional system roles (observational).
 */
export function buildProtocolAlignmentAndConflicts(
  executive: GlobalFusionExecutiveSummary,
  assembly: GlobalFusionExecutiveAssemblyInput,
): { alignment: GlobalFusionProtocolAlignment[]; conflicts: GlobalFusionProtocolConflict[] } {
  const alignment: GlobalFusionProtocolAlignment[] = [];
  const conflicts: GlobalFusionProtocolConflict[] = [];

  const growthPush =
    executive.themes.some((t) => t.id === "growth_acceleration" && t.signalStrength >= 0.35) ||
    executive.topPriorities.some((p) => p.theme === "growth_acceleration");
  const funnelTight =
    executive.themes.some((t) => t.id === "funnel_first" && t.signalStrength >= 0.25) ||
    executive.topPriorities.some((p) => p.theme === "funnel_first");
  const govHot =
    executive.rolloutSummary.governanceDecision != null &&
    executive.rolloutSummary.governanceDecision !== "healthy" &&
    executive.rolloutSummary.governanceDecision !== "watch";
  const rankingExpand = executive.topPriorities.some((p) => p.theme === "ranking_expansion_candidate");
  const freeze = assembly.freezeState.learningFrozen || assembly.freezeState.influenceFrozen;
  const operatorBlocked = freeze || assembly.monitoring.fallbackRate >= 0.4;

  if (growthPush && funnelTight) {
    alignment.push({
      id: nextId("al"),
      theme: "growth_with_funnel_discipline",
      supportedSystems: ["growth_loop", "operator"],
      strength: 0.55,
      rationale: "Growth themes co-occur with funnel focus — coordinate sequencing before scaling spend.",
    });
  }

  if (growthPush && operatorBlocked) {
    conflicts.push({
      id: nextId("cf"),
      description: "Growth-oriented signals appear while Fusion-local readiness or fallback suggests constrained execution capacity.",
      systemsInvolved: ["growth_loop", "operator", "platform_core"],
      fusionSources: ["brain", "ads", "cro", "ranking"],
      suggestedAttention: "Reconcile expansion intent with stability / fallback signals before parallel pushes.",
      severity: "medium",
    });
  }

  if (rankingExpand && govHot) {
    conflicts.push({
      id: nextId("cf"),
      description: "Ranking expansion signals coincide with elevated Fusion governance posture.",
      systemsInvolved: ["growth_loop", "command_center", "platform_core"],
      fusionSources: ["ranking", "brain"],
      suggestedAttention: "Treat ranking moves as governance-reviewed; avoid silent cross-system escalation.",
      severity: "high",
    });
  }

  if (assembly.monitoring.conflictRate >= 0.42 && assembly.monitoring.lowEvidenceRate >= 0.45) {
    conflicts.push({
      id: nextId("cf"),
      description: "High cross-system conflict rate with low-evidence conditions — coordination clarity may be degraded.",
      systemsInvolved: ["swarm", "command_center", "growth_loop"],
      fusionSources: ["brain", "ads", "cro", "ranking"],
      suggestedAttention: "Prefer explicit human review channels over automated harmonization.",
      severity: "medium",
    });
  }

  if (executive.companyReadiness.label === "strong" && !govHot) {
    alignment.push({
      id: nextId("al"),
      theme: "baseline_alignment",
      supportedSystems: ["swarm", "growth_loop", "operator", "platform_core", "command_center"],
      strength: 0.4,
      rationale: "Executive readiness reads strong with no acute governance escalation (observational).",
    });
  }

  return { alignment, conflicts };
}
