/**
 * Phase H protocol observability — [global:fusion:protocol]
 */
import { logInfo, logWarn } from "@/lib/logger";
import type { GlobalFusionOperatingProtocol, GlobalFusionProtocolTargetSystem } from "./global-fusion.types";

const NS = "[global:fusion:protocol]";

type PMon = {
  builds: number;
  signalsTotal: number;
  directivesTotal: number;
  alignmentIssues: number;
  conflictsTotal: number;
  perSystem: Partial<Record<GlobalFusionProtocolTargetSystem, number>>;
  missingMapping: number;
  lastProtocolAt: string | null;
};

let pm: PMon = {
  builds: 0,
  signalsTotal: 0,
  directivesTotal: 0,
  alignmentIssues: 0,
  conflictsTotal: 0,
  perSystem: {},
  missingMapping: 0,
  lastProtocolAt: null,
};

function countTargets(protocol: GlobalFusionOperatingProtocol): void {
  const tally: Partial<Record<GlobalFusionProtocolTargetSystem, number>> = {};
  for (const s of protocol.signals) {
    if (!s.targetSystems.length) pm.missingMapping++;
    for (const t of s.targetSystems) {
      tally[t] = (tally[t] ?? 0) + 1;
      pm.perSystem[t] = (pm.perSystem[t] ?? 0) + 1;
    }
  }
  const vals = Object.values(tally);
  const max = vals.length ? Math.max(...vals) : 0;
  if (max > Math.max(3, protocol.signals.length * 0.45) && protocol.signals.length > 6) {
    logWarn(NS, { event: "observation", kind: "one_system_overloaded", maxSignals: max });
  }
}

export function recordProtocolBuild(protocol: GlobalFusionOperatingProtocol, monitoringEnabled: boolean): void {
  if (!monitoringEnabled) return;
  try {
    pm.builds++;
    pm.lastProtocolAt = protocol.generatedAt;
    pm.signalsTotal += protocol.signals.length;
    pm.directivesTotal += protocol.directives.length;
    pm.alignmentIssues += protocol.alignment.length;
    pm.conflictsTotal += protocol.conflicts.length;
    countTargets(protocol);
    if (protocol.conflicts.length > 5) {
      logWarn(NS, { event: "observation", kind: "excessive_cross_system_conflict", count: protocol.conflicts.length });
    }
    if (protocol.alignment.length === 0 && protocol.conflicts.length > 2) {
      logWarn(NS, { event: "observation", kind: "poor_alignment_cluster" });
    }
    if (!protocol.active) {
      logInfo(NS, { event: "protocol_inactive", reason: protocol.inactiveReason });
      return;
    }
    logInfo(NS, {
      event: "protocol_generated",
      signals: protocol.signals.length,
      directives: protocol.directives.length,
      conflicts: protocol.conflicts.length,
      alignment: protocol.alignment.length,
      systems: protocol.meta.contributingSystemsCount,
    });
  } catch {
    /* noop */
  }
}

export function getProtocolMonitoringSummary(): PMon {
  return {
    builds: pm.builds,
    signalsTotal: pm.signalsTotal,
    directivesTotal: pm.directivesTotal,
    alignmentIssues: pm.alignmentIssues,
    conflictsTotal: pm.conflictsTotal,
    perSystem: { ...pm.perSystem },
    missingMapping: pm.missingMapping,
    lastProtocolAt: pm.lastProtocolAt,
  };
}

export function resetGlobalFusionProtocolMonitoringForTests(): void {
  pm = {
    builds: 0,
    signalsTotal: 0,
    directivesTotal: 0,
    alignmentIssues: 0,
    conflictsTotal: 0,
    perSystem: {},
    missingMapping: 0,
    lastProtocolAt: null,
  };
}
