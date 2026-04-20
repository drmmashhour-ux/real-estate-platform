import { runLegalDetectors } from "./detectors/legal-detector-registry";
import { severityRank } from "./detectors/legal-detector-utils";
import {
  buildLegalIntelligenceSnapshot,
  type BuildLegalIntelligenceSnapshotParams,
} from "./legal-intelligence-signal-builder.service";
import type {
  LegalAnomalyIndicator,
  LegalFraudIndicator,
  LegalIntelligenceSignal,
  LegalIntelligenceSignalType,
  LegalIntelligenceSeverity,
  LegalIntelligenceSummary,
} from "./legal-intelligence.types";

export type LegalIntelligenceParams = BuildLegalIntelligenceSnapshotParams;

const FRAUD_PATTERN_TYPES = new Set<LegalIntelligenceSignalType>([
  "duplicate_document",
  "duplicate_identity",
  "cross_entity_conflict",
  "suspicious_resubmission_pattern",
  "high_risk_submission_burst",
  "conflicting_records",
  "suspicious_data_pattern",
]);

const ANOMALY_TYPES = new Set<LegalIntelligenceSignalType>([
  "metadata_anomaly",
  "mismatched_actor_workflow",
  "review_delay_risk",
  "missing_required_cluster",
  "high_rejection_rate",
  "missing_required_fields",
  "inconsistent_legal_data",
  "incomplete_declaration",
]);

function dedupeSignals(signals: LegalIntelligenceSignal[]): LegalIntelligenceSignal[] {
  const seen = new Set<string>();
  const out: LegalIntelligenceSignal[] = [];
  for (const s of signals) {
    if (seen.has(s.id)) continue;
    seen.add(s.id);
    out.push(s);
  }
  return out;
}

function sortSignals(signals: LegalIntelligenceSignal[]): LegalIntelligenceSignal[] {
  return [...signals].sort((a, b) => {
    const sr = severityRank(b.severity) - severityRank(a.severity);
    if (sr !== 0) return sr;
    return Date.parse(b.observedAt) - Date.parse(a.observedAt);
  });
}

function buildSummaryFromSignals(
  signals: LegalIntelligenceSignal[],
  snapshotBuiltAt: string,
  entityType: string,
  entityId: string,
): LegalIntelligenceSummary {
  const countsBySeverity: Record<LegalIntelligenceSeverity, number> = {
    info: 0,
    warning: 0,
    critical: 0,
  };
  const countsBySignalType: Partial<Record<LegalIntelligenceSignalType, number>> = {};
  for (const s of signals) {
    countsBySeverity[s.severity] += 1;
    countsBySignalType[s.signalType] = (countsBySignalType[s.signalType] ?? 0) + 1;
  }

  const anomalyBuckets = new Map<LegalIntelligenceSignalType, number>();
  for (const s of signals) {
    if (ANOMALY_TYPES.has(s.signalType)) {
      anomalyBuckets.set(s.signalType, (anomalyBuckets.get(s.signalType) ?? 0) + 1);
    }
  }
  const topAnomalyKinds = [...anomalyBuckets.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([kind, count]) => ({ kind, count }));

  const fraudBuckets = new Map<string, number>();
  for (const s of signals) {
    if (FRAUD_PATTERN_TYPES.has(s.signalType)) {
      const label = `Risk indicator (${s.signalType.replace(/_/g, " ")})`;
      fraudBuckets.set(label, (fraudBuckets.get(label) ?? 0) + 1);
    }
  }
  const topFraudIndicatorLabels = [...fraudBuckets.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([label, count]) => ({ label, count }));

  return {
    builtAt: snapshotBuiltAt,
    entityType,
    entityId,
    countsBySeverity,
    countsBySignalType,
    totalSignals: signals.length,
    topAnomalyKinds,
    topFraudIndicatorLabels,
    freshnessNote:
      signals.length === 0
        ? "No advisory signals in the current window for this scope."
        : "Signals reflect deterministic metadata checks only — human review decides outcomes.",
  };
}

async function collectSignals(params: LegalIntelligenceParams): Promise<{
  snapshotBuiltAt: string;
  signals: LegalIntelligenceSignal[];
  entityType: string;
  entityId: string;
}> {
  try {
    const snapshot = await buildLegalIntelligenceSnapshot(params);
    const raw = runLegalDetectors(snapshot);
    return {
      snapshotBuiltAt: snapshot.builtAt,
      signals: sortSignals(dedupeSignals(raw)),
      entityType: snapshot.entityType,
      entityId: snapshot.entityId,
    };
  } catch {
    const now = new Date().toISOString();
    return { snapshotBuiltAt: now, signals: [], entityType: params.entityType, entityId: params.entityId };
  }
}

/** Single pass: summary + signals (for policy / admin; avoids duplicate snapshot reads). */
export async function getLegalIntelligenceBundle(params: LegalIntelligenceParams): Promise<{
  summary: LegalIntelligenceSummary;
  signals: LegalIntelligenceSignal[];
}> {
  const { snapshotBuiltAt, signals, entityType, entityId } = await collectSignals(params);
  return {
    summary: buildSummaryFromSignals(signals, snapshotBuiltAt, entityType, entityId),
    signals,
  };
}

export async function getLegalIntelligenceSignals(params: LegalIntelligenceParams): Promise<LegalIntelligenceSignal[]> {
  const { signals } = await collectSignals(params);
  return signals;
}

export async function getLegalFraudIndicators(params: LegalIntelligenceParams): Promise<LegalFraudIndicator[]> {
  const { signals } = await collectSignals(params);
  const out: LegalFraudIndicator[] = [];
  let i = 0;
  for (const s of signals) {
    if (!FRAUD_PATTERN_TYPES.has(s.signalType)) continue;
    i += 1;
    out.push({
      id: `fi_${s.id.slice(0, 120)}_${i}`,
      entityType: s.entityType,
      entityId: s.entityId,
      label: `Risk indicator (${s.signalType.replace(/_/g, " ")})`,
      explanation: s.explanation,
      severity: s.severity,
      relatedSignalTypes: [s.signalType],
      observedAt: s.observedAt,
    });
  }
  return out;
}

export async function getLegalAnomalyIndicators(params: LegalIntelligenceParams): Promise<LegalAnomalyIndicator[]> {
  const { signals } = await collectSignals(params);
  const out: LegalAnomalyIndicator[] = [];
  let i = 0;
  for (const s of signals) {
    if (!ANOMALY_TYPES.has(s.signalType)) continue;
    i += 1;
    out.push({
      id: `ai_${s.id.slice(0, 120)}_${i}`,
      entityType: s.entityType,
      entityId: s.entityId,
      anomalyKind: s.signalType,
      explanation: s.explanation,
      severity: s.severity,
      observedAt: s.observedAt,
    });
  }
  return out;
}

export async function summarizeLegalIntelligence(params: LegalIntelligenceParams): Promise<LegalIntelligenceSummary> {
  const { snapshotBuiltAt, signals, entityType, entityId } = await collectSignals(params);
  return buildSummaryFromSignals(signals, snapshotBuiltAt, entityType, entityId);
}
