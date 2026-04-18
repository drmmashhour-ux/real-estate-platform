/**
 * Phase H — Company operating protocol assembly (read-only coordination contract).
 */
import { globalFusionFlags } from "@/config/feature-flags";
import { buildGlobalFusionPrimarySurface } from "./global-fusion-primary.service";
import { getGlobalFusionMonitoringSnapshot } from "./global-fusion-monitoring.service";
import { getLastGovernanceSnapshot } from "./global-fusion-governance-monitoring.service";
import { getLastLearningSummary, getGlobalFusionLearningHealthSnapshot } from "./global-fusion-learning-monitoring.service";
import { getGlobalFusionFreezeState } from "./global-fusion-freeze.service";
import {
  buildGlobalFusionExecutiveSummaryFromAssembly,
  monitoringSnapshotToExecutiveInput,
} from "./global-fusion-executive.service";
import { inferTargetsFromExecutiveTheme, mergeTargets } from "./global-fusion-protocol-targets";
import { buildProtocolAlignmentAndConflicts } from "./global-fusion-protocol-alignment.service";
import { recordProtocolBuild } from "./global-fusion-protocol-monitoring.service";
import { maybePersistProtocolSnapshot } from "./global-fusion-protocol-persistence.service";
import type {
  GlobalFusionExecutiveAssemblyInput,
  GlobalFusionExecutiveSummary,
  GlobalFusionOperatingProtocol,
  GlobalFusionProtocolDirective,
  GlobalFusionProtocolPriority,
  GlobalFusionProtocolSignal,
  GlobalFusionPrimarySurfaceResult,
} from "./global-fusion.types";

let signalSeq = 0;
function nextSignalId(): string {
  signalSeq++;
  return `ps_${signalSeq}`;
}

export function resetGlobalFusionProtocolSignalSeqForTests(): void {
  signalSeq = 0;
}

function mapRiskLevel(
  sev: "low" | "medium" | "high",
): GlobalFusionProtocolSignal["riskLevel"] {
  return sev;
}

function buildSignalsFromExecutive(
  executive: GlobalFusionExecutiveSummary,
  assembly: GlobalFusionExecutiveAssemblyInput,
): GlobalFusionProtocolSignal[] {
  const out: GlobalFusionProtocolSignal[] = [];
  const ts = new Date().toISOString();

  for (const p of executive.topPriorities.slice(0, 10)) {
    const targets = mergeTargets(inferTargetsFromExecutiveTheme(p.theme), []);
    out.push({
      id: nextSignalId(),
      type: "priority",
      targetSystems: targets,
      priorityLevel: p.importance,
      confidence: p.confidence,
      riskLevel: null,
      recommendationType: p.theme,
      reasons: p.supportingSignals.slice(0, 8),
      sourceSystems: p.sourceSystems,
      timestamp: ts,
    });
  }

  for (const r of executive.topRisks.slice(0, 8)) {
    out.push({
      id: nextSignalId(),
      type: "risk",
      targetSystems: mergeTargets(
        ["command_center", "operator", "platform_core"],
        inferTargetsFromExecutiveTheme("governance_attention"),
      ),
      priorityLevel: r.severity === "high" ? "high" : "medium",
      confidence: null,
      riskLevel: mapRiskLevel(r.severity),
      recommendationType: "risk_attention",
      reasons: r.reasons.slice(0, 8),
      sourceSystems: r.sourceSystems,
      timestamp: ts,
    });
  }

  for (const o of executive.topOpportunities.slice(0, 6)) {
    out.push({
      id: nextSignalId(),
      type: "opportunity",
      targetSystems: mergeTargets(["growth_loop", "swarm"], []),
      priorityLevel: "medium",
      confidence: o.confidence,
      riskLevel: "low",
      recommendationType: "opportunity",
      reasons: [o.rationale],
      sourceSystems: o.sourceSystems,
      timestamp: ts,
    });
  }

  for (const b of executive.topBlockers.slice(0, 8)) {
    out.push({
      id: nextSignalId(),
      type: "blocker",
      targetSystems: mergeTargets(["operator", "platform_core"], []),
      priorityLevel: "high",
      confidence: null,
      riskLevel: "medium",
      recommendationType: "blocker",
      reasons: [b.summary],
      sourceSystems: b.sourceSystems,
      timestamp: ts,
    });
  }

  if (assembly.freezeState.learningFrozen || assembly.freezeState.influenceFrozen) {
    out.push({
      id: nextSignalId(),
      type: "blocker",
      targetSystems: ["operator", "platform_core", "command_center"],
      priorityLevel: "high",
      confidence: null,
      riskLevel: "medium",
      recommendationType: "fusion_freeze",
      reasons: [assembly.freezeState.reason ?? "fusion_local_freeze"],
      sourceSystems: ["brain", "ads", "cro", "ranking"],
      timestamp: ts,
    });
  }

  return out;
}

function buildProtocolPriorities(executive: GlobalFusionExecutiveSummary): GlobalFusionProtocolPriority[] {
  return executive.topPriorities.slice(0, 10).map((p) => ({
    id: p.id,
    title: p.title,
    summary: p.summary,
    targetSystems: inferTargetsFromExecutiveTheme(p.theme),
    importance: p.importance,
    executiveTheme: p.theme,
  }));
}

function buildDirectives(
  executive: GlobalFusionExecutiveSummary,
  assembly: GlobalFusionExecutiveAssemblyInput,
): GlobalFusionProtocolDirective[] {
  const d: GlobalFusionProtocolDirective[] = [];
  const now = new Date().toISOString();
  const gd = assembly.governanceSnapshot?.status.decision;

  if (gd === "rollback_recommended" || gd === "require_human_review") {
    d.push({
      id: "dir_gov",
      directiveType: "governance_sync",
      targetSystems: ["command_center", "operator", "platform_core"],
      summary: "Align cross-system posture with Fusion governance advisory before expanding automated coordination.",
      priority: "high",
      constraints: ["no_automated_execution_override"],
      notes: assembly.governanceSnapshot?.status.reasons?.slice(0, 6),
      provenance: { source: "fusion_governance", generatedAt: now },
    });
  }

  if (executive.topPriorities.some((p) => p.theme === "funnel_first")) {
    d.push({
      id: "dir_funnel",
      directiveType: "stabilize_funnel",
      targetSystems: ["growth_loop", "operator"],
      summary: "Prioritize funnel stability signals in Growth Loop and Operator planning (advisory sequencing).",
      priority: "medium",
      provenance: { source: "fusion_executive", generatedAt: now },
    });
  }

  if (executive.companyReadiness.label === "at_risk" || executive.overallStatus === "degraded") {
    d.push({
      id: "dir_coord",
      directiveType: "coordinate_review",
      targetSystems: ["swarm", "command_center", "growth_loop"],
      summary: "Hold explicit coordination review — executive readiness degraded (observational).",
      priority: "high",
      notes: executive.notes.slice(0, 6),
      provenance: { source: "fusion_executive", generatedAt: now },
    });
  }

  if (assembly.monitoring.missingSourceRate >= 0.35) {
    d.push({
      id: "dir_evi",
      directiveType: "evidence_gathering",
      targetSystems: ["operator", "command_center"],
      summary: "Reduce dependence on thin evidence — improve coverage before scaling cross-system initiatives.",
      priority: "medium",
      provenance: { source: "fusion_monitoring", generatedAt: now },
    });
  }

  return d.slice(0, 12);
}

function inactiveProtocol(reason: string): GlobalFusionOperatingProtocol {
  const now = new Date().toISOString();
  return {
    generatedAt: now,
    active: false,
    inactiveReason: reason,
    priorities: [],
    risks: [],
    opportunities: [],
    blockers: [],
    directives: [],
    alignment: [],
    conflicts: [],
    signals: [],
    meta: {
      protocolVersion: 1,
      contributingSystemsCount: 0,
      executiveSummaryUsed: false,
      governanceDecision: null,
      notes: [reason],
    },
  };
}

export type BuildOperatingProtocolOpts = {
  primary?: GlobalFusionPrimarySurfaceResult | null;
  days?: number;
  limit?: number;
};

/**
 * Pure path: build protocol from an executive summary + assembly (tests).
 */
export function buildGlobalFusionOperatingProtocolFromContext(
  executive: GlobalFusionExecutiveSummary,
  assembly: GlobalFusionExecutiveAssemblyInput,
): GlobalFusionOperatingProtocol {
  const { alignment, conflicts } = buildProtocolAlignmentAndConflicts(executive, assembly);
  const signals = buildSignalsFromExecutive(executive, assembly);
  for (const a of alignment) {
    signals.push({
      id: nextSignalId(),
      type: "alignment",
      targetSystems: a.supportedSystems,
      priorityLevel: "low",
      confidence: a.strength,
      riskLevel: null,
      recommendationType: a.theme,
      reasons: [a.rationale],
      sourceSystems: ["brain", "ads", "cro", "ranking"],
      timestamp: new Date().toISOString(),
    });
  }

  const protocol: GlobalFusionOperatingProtocol = {
    generatedAt: new Date().toISOString(),
    active: true,
    priorities: buildProtocolPriorities(executive),
    risks: signals.filter((s) => s.type === "risk"),
    opportunities: signals.filter((s) => s.type === "opportunity"),
    blockers: signals.filter((s) => s.type === "blocker"),
    directives: buildDirectives(executive, assembly),
    alignment,
    conflicts,
    signals,
    meta: {
      protocolVersion: 1,
      contributingSystemsCount: executive.provenance.contributingSystemsCount,
      executiveSummaryUsed: true,
      governanceDecision: executive.rolloutSummary.governanceDecision,
      notes: executive.notes.slice(0, 12),
    },
  };

  return protocol;
}

/**
 * Async: load Fusion primary + monitoring + governance + learning + freeze, derive executive summary, then protocol.
 */
export async function buildGlobalFusionOperatingProtocol(
  opts: BuildOperatingProtocolOpts = {},
): Promise<{ protocol: GlobalFusionOperatingProtocol; executiveSummary: GlobalFusionExecutiveSummary }> {
  if (!globalFusionFlags.globalFusionProtocolV1) {
    return {
      protocol: inactiveProtocol("FEATURE_GLOBAL_FUSION_PROTOCOL_V1_off"),
      executiveSummary: stubExecutiveDisabled(),
    };
  }

  try {
    const primary = opts.primary ?? (await buildGlobalFusionPrimarySurface({ days: opts.days ?? 7, limit: opts.limit ?? 10 }));
    const mon = getGlobalFusionMonitoringSnapshot();
    const assembly: GlobalFusionExecutiveAssemblyInput = {
      fusionPayload: primary.fusionPayload,
      primaryResult: primary,
      monitoring: monitoringSnapshotToExecutiveInput(mon),
      governanceSnapshot: globalFusionFlags.globalFusionGovernanceV1 ? getLastGovernanceSnapshot() : null,
      learningSummary: globalFusionFlags.globalFusionLearningV1 ? getLastLearningSummary() : null,
      learning:
        globalFusionFlags.globalFusionLearningV1
          ? (() => {
              const h = getGlobalFusionLearningHealthSnapshot();
              return {
                learningRuns: h.learningRuns,
                weightDriftL1: h.weightDriftL1,
                insufficientLinkageRate: h.insufficientLinkageRate,
              };
            })()
          : null,
      freezeState: getGlobalFusionFreezeState(),
    };

    const executive = buildGlobalFusionExecutiveSummaryFromAssembly(assembly, primary);
    const protocol = buildGlobalFusionOperatingProtocolFromContext(executive, assembly);
    recordProtocolBuild(protocol, globalFusionFlags.globalFusionProtocolMonitoringV1);
    maybePersistProtocolSnapshot(protocol);
    return { protocol, executiveSummary: executive };
  } catch {
    const executive = stubExecutiveDisabled("protocol_assembly_error");
    const p = inactiveProtocol("protocol_assembly_exception");
    p.meta.notes.push("protocol_assembly_exception");
    recordProtocolBuild(p, globalFusionFlags.globalFusionProtocolMonitoringV1);
    maybePersistProtocolSnapshot(p);
    return { protocol: p, executiveSummary: executive };
  }
}

function stubExecutiveDisabled(reason?: string): GlobalFusionExecutiveSummary {
  const now = new Date().toISOString();
  return {
    overallStatus: "healthy",
    companyReadiness: { label: "strong", summary: "Stub", factors: [] },
    topPriorities: [],
    topRisks: [],
    topOpportunities: [],
    topBlockers: [],
    themes: [],
    rolloutSummary: {
      pathLabel: "unknown",
      primaryActive: false,
      fallbackRate: 0,
      missingSourceRate: 0,
      conflictRate: 0,
      governanceDecision: null,
    },
    healthSummary: {
      overallStatus: "ok",
      observationalWarnings: [],
      insufficientEvidenceCount: 0,
      missingSourceCount: 0,
      fusedAgreementApprox: null,
    },
    notes: reason ? [reason] : [],
    narrativeBlocks: [],
    provenance: {
      generatedAt: now,
      fusionV1Enabled: globalFusionFlags.globalFusionV1,
      executiveLayerEnabled: globalFusionFlags.globalFusionExecutiveLayerV1,
      contributingSystemsCount: 0,
      normalizedSignalCount: 0,
      sourcesUsed: [],
    },
    disabled: true,
    disabledReason: reason ?? "stub",
  };
}
