/**
 * Observability for Global Fusion V1 — logs only; no side effects on source systems.
 * Phase D: in-process aggregate counters for post-cutover monitoring (read-only, best-effort).
 */
import { logInfo, logWarn } from "@/lib/logger";
import type {
  GlobalFusionPayload,
  GlobalFusionPrimarySurfaceResult,
  GlobalFusionSource,
} from "./global-fusion.types";

const NS = "[global:fusion]";
const MON = "[global:fusion:monitoring]";

/** Per-payload snapshot for logging (legacy name). */
export type GlobalFusionMonitoringSnapshot = {
  contributingSystemsCount: number;
  normalizedSignalCount: number;
  opportunityCount: number;
  riskCount: number;
  conflictCount: number;
  insufficientEvidenceCount: number;
  missingSourceCount: number;
};

export function buildGlobalFusionMonitoringSnapshot(
  payload: GlobalFusionPayload,
  insufficientEvidenceCount: number,
): GlobalFusionMonitoringSnapshot {
  const snap = payload.snapshot;
  return {
    contributingSystemsCount: payload.meta.contributingSystemsCount,
    normalizedSignalCount: payload.meta.normalizedSignalCount,
    opportunityCount: snap?.opportunities.length ?? 0,
    riskCount: snap?.risks.length ?? 0,
    conflictCount: payload.meta.conflictCount,
    insufficientEvidenceCount,
    missingSourceCount: payload.meta.missingSources.length,
  };
}

export function logGlobalFusionPayload(
  payload: GlobalFusionPayload,
  opts: {
    insufficientEvidenceCount: number;
    malformedSignalCount: number;
    disagreementRateHint: number;
  },
): void {
  const snap = payload.snapshot;
  logInfo(NS, {
    event: "fusion_payload",
    enabled: payload.enabled,
    systemsUsed: payload.meta.contributingSystemsCount,
    signals: payload.meta.normalizedSignalCount,
    recommendations: payload.meta.recommendationCount,
    conflicts: payload.meta.conflictCount,
    missingSources: payload.meta.missingSources.length,
    overall: payload.health.overallStatus,
    influenceFlag: payload.meta.influenceFlag,
    primaryFlag: payload.meta.primaryFlag,
  });

  if (payload.meta.missingSources.length > 2) {
    logWarn(NS, {
      event: "missing_sources_elevated",
      count: payload.meta.missingSources.length,
      samples: payload.meta.missingSources.slice(0, 6),
    });
  }

  if (opts.malformedSignalCount > 0) {
    logWarn(NS, { event: "malformed_signals", count: opts.malformedSignalCount });
  }

  if (snap && snap.conflicts.filter((c) => c.severity === "high").length > 3) {
    logWarn(NS, { event: "high_severity_conflicts_elevated", count: snap.conflicts.length });
  }

  if (opts.disagreementRateHint > 0.55 && snap && snap.signals.length > 4) {
    logWarn(NS, { event: "high_disagreement_hint", rate: opts.disagreementRateHint });
  }

  if (snap && snap.signals.length === 0 && payload.meta.contributingSystemsCount > 0) {
    logWarn(NS, { event: "empty_signals_unexpected", note: "observational" });
  }

  for (const w of payload.health.observationalWarnings.slice(0, 5)) {
    logWarn(NS, { event: "health_warning", detail: w });
  }

  if (snap?.influence) {
    logInfo("[global:fusion:influence]", {
      event: "payload",
      influenceEnabled: payload.meta.influenceFlag,
      applied: snap.influence.applied,
      skipped: snap.influence.skipped,
      gateTier: snap.influence.gate.tier,
      metrics: snap.influence.metrics,
      missingSources: payload.meta.missingSources.length,
      reasonCodes: snap.influence.reasons.map((r) => r.code).slice(0, 8),
      observationalWarningsCount: snap.influence.observationalWarnings.length,
      humanReviewHints: snap.influence.metrics.humanReviewCount,
    });
  }
}

// ─── Phase D: aggregate run monitoring (in-memory; process-local) ─────────────────

export type GlobalFusionAggregateMonitoringSnapshot = {
  runsTotal: number;
  runsPrimary: number;
  runsFallback: number;
  runsSourceAdvisoryDefault: number;
  fallbackRate: number;
  systemsCoverage: {
    brain: number;
    ads: number;
    cro: number;
    ranking: number;
  };
  missingSourceRate: number;
  conflictRate: number;
  disagreementRate: number;
  lowEvidenceRate: number;
  influenceAppliedRate: number;
  influenceSkippedRate: number;
  unstableOrderingRate: number;
  anomalyRate: number;
  malformedInputRate: number;
  emptyOutputRate: number;
  counters: {
    runsTotal: number;
    runsPrimary: number;
    runsFallback: number;
    runsSourceAdvisoryDefault: number;
    missingSourceRuns: number;
    highConflictRuns: number;
    highDisagreementRuns: number;
    lowEvidenceRuns: number;
    emptyOutputRuns: number;
    malformedInputRuns: number;
    influenceAppliedRuns: number;
    influenceSkippedRuns: number;
    unstableOrderingRuns: number;
    anomalyRuns: number;
    warningSamples: number;
  };
  lastUpdatedAt: string;
};

type PhaseDState = {
  runsTotal: number;
  runsPrimary: number;
  runsFallback: number;
  runsSourceAdvisoryDefault: number;
  missingSourceRuns: number;
  highConflictRuns: number;
  highDisagreementRuns: number;
  lowEvidenceRuns: number;
  emptyOutputRuns: number;
  malformedInputRuns: number;
  influenceAppliedRuns: number;
  influenceSkippedRuns: number;
  unstableOrderingRuns: number;
  anomalyRuns: number;
  warningSamples: number;
  coverageBrain: number;
  coverageAds: number;
  coverageCro: number;
  coverageRanking: number;
  lastOppOrderFingerprint: string | null;
  lastFallbackReasons: string[];
  lastWarningCodes: string[];
  lastWarnedAtRun: Record<string, number>;
};

const WARN_COOLDOWN_RUNS = 50;

function initialPhaseDState(): PhaseDState {
  return {
    runsTotal: 0,
    runsPrimary: 0,
    runsFallback: 0,
    runsSourceAdvisoryDefault: 0,
    missingSourceRuns: 0,
    highConflictRuns: 0,
    highDisagreementRuns: 0,
    lowEvidenceRuns: 0,
    emptyOutputRuns: 0,
    malformedInputRuns: 0,
    influenceAppliedRuns: 0,
    influenceSkippedRuns: 0,
    unstableOrderingRuns: 0,
    anomalyRuns: 0,
    warningSamples: 0,
    coverageBrain: 0,
    coverageAds: 0,
    coverageCro: 0,
    coverageRanking: 0,
    lastOppOrderFingerprint: null,
    lastFallbackReasons: [],
    lastWarningCodes: [],
    lastWarnedAtRun: {},
  };
}

let phaseD: PhaseDState = initialPhaseDState();

function safeDiv(n: number, d: number): number {
  if (!Number.isFinite(n) || !Number.isFinite(d) || d <= 0) return 0;
  return Math.min(1, Math.max(0, n / d));
}

function finite01(x: number): number {
  if (!Number.isFinite(x)) return 0;
  return Math.min(1, Math.max(0, x));
}

function pushRing(arr: string[], item: string, max: number): void {
  arr.push(item);
  if (arr.length > max) arr.splice(0, arr.length - max);
}

function shouldEmitWarn(key: string): boolean {
  const last = phaseD.lastWarnedAtRun[key] ?? 0;
  if (phaseD.runsTotal - last < WARN_COOLDOWN_RUNS) return false;
  phaseD.lastWarnedAtRun[key] = phaseD.runsTotal;
  return true;
}

function evaluateMonitoringThresholds(): void {
  const t = phaseD.runsTotal;
  if (t < 3) return;

  const fb = safeDiv(phaseD.runsFallback, t);
  if (fb > 0.35 && shouldEmitWarn("high_fallback_rate")) {
    logWarn(MON, { event: "threshold", kind: "high_fallback_rate", fallbackRate: finite01(fb), runsTotal: t });
  }

  const ms = safeDiv(phaseD.missingSourceRuns, t);
  if (ms > 0.45 && shouldEmitWarn("weak_missing_sources")) {
    logWarn(MON, { event: "threshold", kind: "repeated_missing_sources", missingSourceRate: finite01(ms), runsTotal: t });
  }

  const hi = safeDiv(phaseD.highConflictRuns, t);
  if (hi > 0.4 && shouldEmitWarn("persistent_high_conflict")) {
    logWarn(MON, { event: "threshold", kind: "persistent_high_conflict_rate", conflictRate: finite01(hi), runsTotal: t });
  }

  const dis = safeDiv(phaseD.highDisagreementRuns, t);
  if (dis > 0.45 && shouldEmitWarn("excessive_disagreement")) {
    logWarn(MON, { event: "threshold", kind: "excessive_disagreement", disagreementRate: finite01(dis), runsTotal: t });
  }

  const lowE = safeDiv(phaseD.lowEvidenceRuns, t);
  if (lowE > 0.5 && shouldEmitWarn("low_evidence")) {
    logWarn(MON, { event: "threshold", kind: "low_evidence_elevated", lowEvidenceRate: finite01(lowE), runsTotal: t });
  }

  const infA = safeDiv(phaseD.influenceAppliedRuns, Math.max(1, phaseD.influenceAppliedRuns + phaseD.influenceSkippedRuns));
  if (
    phaseD.influenceAppliedRuns + phaseD.influenceSkippedRuns > 8 &&
    (infA < 0.15 || infA > 0.92) &&
    shouldEmitWarn("influence_balance")
  ) {
    logWarn(MON, {
      event: "threshold",
      kind: "influence_applied_skew",
      influenceAppliedRate: finite01(infA),
      runsTotal: t,
    });
  }

  const uo = safeDiv(phaseD.unstableOrderingRuns, t);
  if (uo > 0.25 && t > 10 && shouldEmitWarn("unstable_order")) {
    logWarn(MON, { event: "threshold", kind: "unstable_ordering_elevated", unstableOrderingRate: finite01(uo), runsTotal: t });
  }

  const emptyR = safeDiv(phaseD.emptyOutputRuns, t);
  if (emptyR > 0.2 && shouldEmitWarn("empty_output")) {
    logWarn(MON, { event: "threshold", kind: "repeated_empty_outputs", emptyOutputRate: finite01(emptyR), runsTotal: t });
  }

  const mal = safeDiv(phaseD.malformedInputRuns, t);
  if (mal > 0.15 && shouldEmitWarn("malformed")) {
    logWarn(MON, { event: "threshold", kind: "malformed_signals_elevated", malformedInputRate: finite01(mal), runsTotal: t });
  }
}

/**
 * Record telemetry for one `buildGlobalFusionPrimarySurface` completion (best-effort; never throws).
 */
export function recordGlobalFusionRun(result: GlobalFusionPrimarySurfaceResult): void {
  try {
    phaseD.runsTotal++;

    if (result.path === "global_fusion_primary" && result.primarySurfaceActive) {
      phaseD.runsPrimary++;
    } else if (result.path === "global_fusion_primary_fallback_default") {
      phaseD.runsFallback++;
      recordGlobalFusionFallback(result.validation.reasons[0] ?? "unknown");
    } else if (result.path === "source_advisory_default") {
      phaseD.runsSourceAdvisoryDefault++;
    }

    const p = result.fusionPayload;
    const snap = p.snapshot;

    if (p.enabled && snap) {
      const meta = p.meta;
      if (meta.missingSources.length > 0) {
        phaseD.missingSourceRuns++;
      }

      const highSev = snap.conflicts.filter((c) => c.severity === "high").length;
      if (highSev > 0) {
        phaseD.highConflictRuns++;
      }

      const disagreementHint = meta.conflictCount / Math.max(1, meta.normalizedSignalCount);
      if (disagreementHint > 0.5 && meta.normalizedSignalCount > 3) {
        phaseD.highDisagreementRuns++;
      }

      if (snap.scores.evidenceScore < 0.35) {
        phaseD.lowEvidenceRuns++;
      }

      const meaningful = snap.signals.length >= 2;
      const emptyAdv =
        snap.opportunities.length === 0 && snap.recommendations.length === 0 && snap.risks.length === 0;
      if (meaningful && emptyAdv) {
        phaseD.emptyOutputRuns++;
      }

      if (meta.malformedNormalizedCount > 0) {
        phaseD.malformedInputRuns++;
      }

      if (meta.influenceFlag && snap.influence) {
        if (snap.influence.applied && !snap.influence.skipped) {
          phaseD.influenceAppliedRuns++;
        } else if (snap.influence.skipped) {
          phaseD.influenceSkippedRuns++;
        }
      }

      const sources = new Set(snap.signals.map((s) => s.source as GlobalFusionSource));
      if (sources.has("brain")) phaseD.coverageBrain++;
      if (sources.has("ads")) phaseD.coverageAds++;
      if (sources.has("cro")) phaseD.coverageCro++;
      if (sources.has("ranking")) phaseD.coverageRanking++;

      let anomalyThisRun = false;
      if (result.path === "global_fusion_primary_fallback_default" || result.validation.reasons.includes("assembly_error")) {
        anomalyThisRun = true;
      }
      if (meaningful && emptyAdv) anomalyThisRun = true;
      if (meta.malformedNormalizedCount > 0) anomalyThisRun = true;
      if (anomalyThisRun) phaseD.anomalyRuns++;

      if (result.surface?.opportunitiesRanked?.length) {
        const fp = result.surface.opportunitiesRanked.map((o) => o.id).join("|");
        if (
          phaseD.lastOppOrderFingerprint !== null &&
          phaseD.lastOppOrderFingerprint.split("|").length === fp.split("|").length &&
          phaseD.lastOppOrderFingerprint !== fp
        ) {
          phaseD.unstableOrderingRuns++;
        }
        phaseD.lastOppOrderFingerprint = fp;
      }
    } else if (!p.enabled || !snap) {
      phaseD.anomalyRuns += 1;
    }

    evaluateMonitoringThresholds();
  } catch {
    /* monitoring must never throw */
  }
}

/** Increment fallback counter and store a reason sample (for tests or auxiliary instrumentation). */
export function recordGlobalFusionFallback(reason: string): void {
  try {
    pushRing(phaseD.lastFallbackReasons, reason, 12);
  } catch {
    /* noop */
  }
}

export function recordGlobalFusionConflict(opts: { highSeverityCount: number }): void {
  try {
    if (opts.highSeverityCount > 0) {
      phaseD.warningSamples += 1;
    }
  } catch {
    /* noop */
  }
}

export function recordGlobalFusionWarning(code: string): void {
  try {
    pushRing(phaseD.lastWarningCodes, code, 24);
    phaseD.warningSamples++;
    if (shouldEmitWarn(`code:${code}`)) {
      logWarn(MON, { event: "warning_sample", code });
    }
  } catch {
    /* noop */
  }
}

export function getGlobalFusionMonitoringSnapshot(): GlobalFusionAggregateMonitoringSnapshot {
  const t = phaseD.runsTotal;
  const infDenom = Math.max(1, phaseD.influenceAppliedRuns + phaseD.influenceSkippedRuns);

  return {
    runsTotal: t,
    runsPrimary: phaseD.runsPrimary,
    runsFallback: phaseD.runsFallback,
    runsSourceAdvisoryDefault: phaseD.runsSourceAdvisoryDefault,
    fallbackRate: safeDiv(phaseD.runsFallback, t),
    systemsCoverage: {
      brain: safeDiv(phaseD.coverageBrain, t),
      ads: safeDiv(phaseD.coverageAds, t),
      cro: safeDiv(phaseD.coverageCro, t),
      ranking: safeDiv(phaseD.coverageRanking, t),
    },
    missingSourceRate: safeDiv(phaseD.missingSourceRuns, t),
    conflictRate: safeDiv(phaseD.highConflictRuns, t),
    disagreementRate: safeDiv(phaseD.highDisagreementRuns, t),
    lowEvidenceRate: safeDiv(phaseD.lowEvidenceRuns, t),
    influenceAppliedRate: safeDiv(phaseD.influenceAppliedRuns, infDenom),
    influenceSkippedRate: safeDiv(phaseD.influenceSkippedRuns, infDenom),
    unstableOrderingRate: safeDiv(phaseD.unstableOrderingRuns, t),
    anomalyRate: safeDiv(phaseD.anomalyRuns, t),
    malformedInputRate: safeDiv(phaseD.malformedInputRuns, t),
    emptyOutputRate: safeDiv(phaseD.emptyOutputRuns, t),
    counters: {
      runsTotal: t,
      runsPrimary: phaseD.runsPrimary,
      runsFallback: phaseD.runsFallback,
      runsSourceAdvisoryDefault: phaseD.runsSourceAdvisoryDefault,
      missingSourceRuns: phaseD.missingSourceRuns,
      highConflictRuns: phaseD.highConflictRuns,
      highDisagreementRuns: phaseD.highDisagreementRuns,
      lowEvidenceRuns: phaseD.lowEvidenceRuns,
      emptyOutputRuns: phaseD.emptyOutputRuns,
      malformedInputRuns: phaseD.malformedInputRuns,
      influenceAppliedRuns: phaseD.influenceAppliedRuns,
      influenceSkippedRuns: phaseD.influenceSkippedRuns,
      unstableOrderingRuns: phaseD.unstableOrderingRuns,
      anomalyRuns: phaseD.anomalyRuns,
      warningSamples: phaseD.warningSamples,
    },
    lastUpdatedAt: new Date().toISOString(),
  };
}

export function resetGlobalFusionMonitoringForTests(): void {
  phaseD = initialPhaseDState();
}
