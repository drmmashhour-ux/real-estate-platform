/**
 * Fusion Phase C — primary advisory orchestration surface (presentation only).
 * Does not replace source systems; does not execute recommendations.
 */
import { fusionSystemFlags, isFusionOrchestrationActive } from "@/config/feature-flags";
import { logInfo, logWarn } from "@/lib/logger";
import { buildFusionSnapshotV1 } from "./fusion-system.service";
import type {
  FusionAdvisoryKind,
  FusionNormalizedSignal,
  FusionPrimaryAdvisoryItem,
  FusionPrimaryBuckets,
  FusionPrimaryGroupedByShort,
  FusionPrimaryObservabilityPayload,
  FusionPrimaryPresentation,
  FusionPrimaryStructuredSurface,
  FusionPrimarySurfaceResult,
  FusionRecommendation,
  FusionScore,
  FusionSignalSource,
  FusionSnapshot,
} from "./fusion-system.types";

const NS = "[fusion:primary]";

const KIND_ORDER: FusionAdvisoryKind[] = [
  "proceed",
  "proceed_with_caution",
  "monitor_only",
  "defer",
  "blocked_by_dependency",
  "insufficient_evidence",
];

let sessionFallbackCount = 0;

/** Test hook — reset session counters. */
export function resetFusionPrimarySurfaceSessionForTests(): void {
  sessionFallbackCount = 0;
}

function scoreFinite(s: FusionScore): boolean {
  const keys: (keyof FusionScore)[] = [
    "fusedConfidence",
    "fusedPriority",
    "fusedRisk",
    "fusedReadiness",
    "agreementScore",
    "evidenceQuality",
    "actionabilityScore",
  ];
  return keys.every((k) => typeof s[k] === "number" && Number.isFinite(s[k] as number));
}

function signalsWellFormed(signals: FusionNormalizedSignal[]): boolean {
  for (const s of signals) {
    if (typeof s.id !== "string" || !s.id) return false;
    if (typeof s.source !== "string") return false;
    if (typeof s.kind !== "string") return false;
  }
  return true;
}

/**
 * Validation gates before treating Fusion as the primary presentation layer.
 */
export function validateFusionPrimaryReadiness(snapshot: FusionSnapshot): { ok: boolean; reason?: string } {
  if (!scoreFinite(snapshot.scores)) return { ok: false, reason: "non_finite_scores" };
  if (!signalsWellFormed(snapshot.signals)) return { ok: false, reason: "malformed_signals" };
  if (snapshot.health.subsystemsAvailable < 1 && snapshot.signals.length === 0) {
    return { ok: false, reason: "insufficient_subsystem_coverage" };
  }
  if (snapshot.signals.length >= 4 && snapshot.recommendations.length === 0) {
    return { ok: false, reason: "unexpected_empty_recommendations" };
  }
  const highConflictRate =
    snapshot.conflicts.length > 12 && snapshot.signals.length > 0 && snapshot.conflicts.length / snapshot.signals.length > 2;
  if (highConflictRate) return { ok: false, reason: "conflict_density_unusable" };
  return { ok: true };
}

function emptyBuckets(): FusionPrimaryBuckets {
  const b = {} as FusionPrimaryBuckets;
  for (const k of KIND_ORDER) b[k] = [];
  return b;
}

function emptyGroupedByShort(): FusionPrimaryGroupedByShort {
  return {
    proceed: [],
    caution: [],
    monitor: [],
    defer: [],
    blocked: [],
    insufficient: [],
  };
}

function kindToShortKey(kind: FusionAdvisoryKind): keyof FusionPrimaryGroupedByShort {
  switch (kind) {
    case "proceed":
      return "proceed";
    case "proceed_with_caution":
      return "caution";
    case "monitor_only":
      return "monitor";
    case "defer":
      return "defer";
    case "blocked_by_dependency":
      return "blocked";
    case "insufficient_evidence":
      return "insufficient";
    default:
      return "monitor";
  }
}

function mapRecommendationToPrimaryItem(r: FusionRecommendation, scores: FusionScore): FusionPrimaryAdvisoryItem {
  const sourceSystems = [...new Set([...r.agreeingSystems, ...r.disagreeingSystems])];
  const reasons = [r.title, r.detail, ...r.keyRisks].filter((x) => typeof x === "string" && x.length > 0);
  const risk = Math.min(
    1,
    Math.max(0, scores.fusedRisk + 0.06 * r.disagreeingSystems.length + 0.04 * r.keyRisks.length),
  );
  const confidence = Math.min(
    1,
    Math.max(0, 0.55 * scores.fusedConfidence + 0.45 * scores.evidenceQuality - 0.03 * r.keyRisks.length),
  );
  return {
    kind: r.kind,
    title: r.title,
    detail: r.detail,
    sourceSystems,
    reasons,
    confidence,
    risk,
    agreeingSystems: r.agreeingSystems,
    disagreeingSystems: r.disagreeingSystems,
    keyRisks: r.keyRisks,
  };
}

function buildStructuredSurface(snapshot: FusionSnapshot, ranked: FusionRecommendation[]): FusionPrimaryStructuredSurface {
  const scores = snapshot.scores;
  const items = ranked.map((r) => mapRecommendationToPrimaryItem(r, scores));
  const groupedBy = emptyGroupedByShort();
  for (const item of items) {
    groupedBy[kindToShortKey(item.kind)].push(item);
  }
  const systems = new Set<FusionSignalSource>();
  for (const s of snapshot.signals) systems.add(s.source);
  return {
    recommendations: items,
    groupedBy,
    meta: {
      agreementScore: scores.agreementScore,
      conflictCount: snapshot.conflicts.length,
      systemsUsed: [...systems],
      evidenceQuality: scores.evidenceQuality,
    },
  };
}

export function buildPrimaryPresentationFromSnapshot(snapshot: FusionSnapshot): FusionPrimaryPresentation {
  const buckets = emptyBuckets();
  const ranked: FusionRecommendation[] = [];
  const byKind = new Map<FusionAdvisoryKind, FusionRecommendation[]>();
  for (const k of KIND_ORDER) byKind.set(k, []);

  for (const r of snapshot.recommendations) {
    const list = byKind.get(r.kind) ?? [];
    list.push(r);
    byKind.set(r.kind, list);
  }
  for (const k of KIND_ORDER) {
    const list = byKind.get(k) ?? [];
    buckets[k] = list;
    ranked.push(...list);
  }

  const systems = new Set<FusionSignalSource>();
  for (const s of snapshot.signals) systems.add(s.source);

  const agreementScore = snapshot.scores.agreementScore;
  const riskReadinessSummary = `readiness=${snapshot.scores.fusedReadiness.toFixed(2)} · risk=${snapshot.scores.fusedRisk.toFixed(2)} · evidence=${snapshot.scores.evidenceQuality.toFixed(2)}`;

  const structured = buildStructuredSurface(snapshot, ranked);

  return {
    rankedRecommendations: ranked,
    buckets,
    contributingSystems: [...systems],
    agreementScore,
    riskReadinessSummary,
    provenanceNote:
      "Advisory fusion composition only — Brain, Ads, Operator, and Platform Core remain authoritative for their domains.",
    structured,
  };
}

function buildObservability(input: {
  snapshot: FusionSnapshot | null;
  primaryFlagOn: boolean;
  primaryPresentationActive: boolean;
  fallbackReason?: string;
}): FusionPrimaryObservabilityPayload {
  const snap = input.snapshot;
  const bucketCounts = {} as Record<FusionAdvisoryKind, number>;
  for (const k of KIND_ORDER) bucketCounts[k] = 0;
  if (snap) {
    for (const r of snap.recommendations) {
      bucketCounts[r.kind] = (bucketCounts[r.kind] ?? 0) + 1;
    }
  }
  const systems = new Set<FusionSignalSource>();
  if (snap) for (const s of snap.signals) systems.add(s.source);

  return {
    primaryFlagOn: input.primaryFlagOn,
    primaryPresentationActive: input.primaryPresentationActive,
    fusedItemCount: snap?.recommendations.length ?? 0,
    contributingSystemsCount: systems.size,
    fallbackCountSession: sessionFallbackCount,
    fallbackReason: input.fallbackReason,
    bucketCounts,
    conflictCount: snap?.conflicts.length ?? 0,
    insufficientEvidenceRate: snap?.health.insufficientEvidenceRate ?? 0,
    sourceCoverageSummary: snap ? `${snap.health.subsystemsAvailable}/${snap.health.subsystemsTotal} subsystems` : "none",
  };
}

function pushWarnings(out: FusionPrimarySurfaceResult, snapshot: FusionSnapshot | null): void {
  if (!snapshot) return;
  if (out.fallbackUsed && out.primaryModeRequested) {
    out.observationalWarnings.push(
      "Heuristic: primary Fusion requested but validation failed — using snapshot-only fallback (advisory unchanged).",
    );
  }
  if (out.primaryPresentationActive && snapshot.health.subsystemsAvailable < 2) {
    out.observationalWarnings.push("Heuristic: weak subsystem coverage — interpret primary surface cautiously.");
  }
  if (sessionFallbackCount >= 3 && fusionSystemFlags.fusionSystemPrimaryV1) {
    out.observationalWarnings.push("Heuristic: repeated primary-surface fallbacks in this process — check fusion inputs.");
  }
  if (out.primaryPresentationActive && snapshot.recommendations.length === 0 && snapshot.signals.length > 2) {
    out.observationalWarnings.push("Heuristic: fused recommendations empty while signals exist — review recommendation builder.");
  }
  if (
    out.primaryPresentationActive &&
    snapshot.health.disagreementPairsApprox > 4 &&
    snapshot.signals.length >= 2
  ) {
    out.observationalWarnings.push("Heuristic: elevated cross-system disagreement — interpret primary ranking cautiously.");
  }
  if (out.primaryPresentationActive && snapshot.health.subsystemsAvailable < snapshot.health.subsystemsTotal) {
    out.observationalWarnings.push("Heuristic: not all Fusion sources contributed signals — coverage gap.");
  }
}

/**
 * Single entry for Growth UI: builds the same `FusionSnapshot` as Phase B, optionally wraps primary presentation.
 * When primary flag is OFF, behavior matches calling `buildFusionSnapshotV1()` alone.
 */
export async function buildFusionPrimarySurface(): Promise<FusionPrimarySurfaceResult> {
  const emptyBucketCounts = (): Record<FusionAdvisoryKind, number> => {
    const b = {} as Record<FusionAdvisoryKind, number>;
    for (const k of KIND_ORDER) b[k] = 0;
    return b;
  };

  const emptyObs = (): FusionPrimaryObservabilityPayload => ({
    primaryFlagOn: fusionSystemFlags.fusionSystemPrimaryV1,
    primaryPresentationActive: false,
    fusedItemCount: 0,
    contributingSystemsCount: 0,
    fallbackCountSession: sessionFallbackCount,
    bucketCounts: emptyBucketCounts(),
    conflictCount: 0,
    insufficientEvidenceRate: 0,
    sourceCoverageSummary: "none",
  });

  if (!isFusionOrchestrationActive()) {
    return {
      primaryModeRequested: fusionSystemFlags.fusionSystemPrimaryV1,
      primaryPresentationActive: false,
      snapshot: null,
      presentation: null,
      fallbackUsed: false,
      observationalWarnings: [],
      observability: { ...emptyObs(), primaryFlagOn: fusionSystemFlags.fusionSystemPrimaryV1 },
    };
  }

  let snapshot: FusionSnapshot | null = null;
  try {
    snapshot = await buildFusionSnapshotV1();
  } catch (e) {
    sessionFallbackCount += 1;
    const msg = e instanceof Error ? e.message : String(e);
    logWarn(NS, "fusion_snapshot_build_failed", { message: msg });
    return {
      primaryModeRequested: fusionSystemFlags.fusionSystemPrimaryV1,
      primaryPresentationActive: false,
      snapshot: null,
      presentation: null,
      fallbackUsed: true,
      fallbackReason: "fusion_build_throw",
      observationalWarnings: [],
      observability: buildObservability({
        snapshot: null,
        primaryFlagOn: fusionSystemFlags.fusionSystemPrimaryV1,
        primaryPresentationActive: false,
        fallbackReason: "fusion_build_throw",
      }),
    };
  }

  if (!fusionSystemFlags.fusionSystemPrimaryV1) {
    const result: FusionPrimarySurfaceResult = {
      primaryModeRequested: false,
      primaryPresentationActive: false,
      snapshot,
      presentation: null,
      fallbackUsed: false,
      observationalWarnings: [],
      observability: buildObservability({
        snapshot,
        primaryFlagOn: false,
        primaryPresentationActive: false,
      }),
    };
    logInfo(NS, {
      event: "phase_b_surface",
      enabled: false,
      fallbackCount: sessionFallbackCount,
      signals: snapshot.signals.length,
      recommendations: snapshot.recommendations.length,
      conflictCount: snapshot.conflicts.length,
    });
    return result;
  }

  const validated = validateFusionPrimaryReadiness(snapshot);
  if (!validated.ok) {
    sessionFallbackCount += 1;
    logWarn(NS, "primary_validation_fallback", { reason: validated.reason });
    const result: FusionPrimarySurfaceResult = {
      primaryModeRequested: true,
      primaryPresentationActive: false,
      snapshot,
      presentation: null,
      fallbackUsed: true,
      fallbackReason: validated.reason,
      observationalWarnings: [],
      observability: buildObservability({
        snapshot,
        primaryFlagOn: true,
        primaryPresentationActive: false,
        fallbackReason: validated.reason,
      }),
    };
    pushWarnings(result, snapshot);
    logInfo(NS, {
      event: "primary_fallback",
      enabled: false,
      fallbackCount: sessionFallbackCount,
      reason: validated.reason,
      signals: snapshot.signals.length,
      recommendations: snapshot.recommendations.length,
      conflictCount: snapshot.conflicts.length,
    });
    return result;
  }

  const presentation = buildPrimaryPresentationFromSnapshot(snapshot);
  const result: FusionPrimarySurfaceResult = {
    primaryModeRequested: true,
    primaryPresentationActive: true,
    snapshot,
    presentation,
    fallbackUsed: false,
    observationalWarnings: [],
    observability: buildObservability({
      snapshot,
      primaryFlagOn: true,
      primaryPresentationActive: true,
    }),
  };
  pushWarnings(result, snapshot);

  logInfo(NS, {
    event: "primary_surface_active",
    enabled: true,
    fallbackCount: sessionFallbackCount,
    signals: snapshot.signals.length,
    recommendations: snapshot.recommendations.length,
    structuredCount: presentation.structured.recommendations.length,
    buckets: KIND_ORDER.map((k) => `${k}:${presentation.buckets[k]?.length ?? 0}`).join(","),
    contributingSystems: presentation.contributingSystems.length,
    conflictCount: snapshot.conflicts.length,
    agreementScore: snapshot.scores.agreementScore,
  });

  return result;
}
