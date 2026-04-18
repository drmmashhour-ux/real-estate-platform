import type { CreateDecisionInput } from "./platform-core.repository";
import type { CoreSystemSource } from "./platform-core.types";
import type { BrainDecisionInput } from "./one-brain.contract";

function mapCoreSourceToBrain(source: CoreSystemSource): BrainDecisionInput["source"] {
  switch (source) {
    case "ADS":
    case "CRO":
    case "RETARGETING":
    case "AB_TEST":
    case "PROFIT":
    case "MARKETPLACE":
    case "UNIFIED":
    case "OPERATOR":
      return source;
    default:
      return "MARKETPLACE";
  }
}

function normalizeGeo(raw: unknown): Record<string, number> | undefined {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return undefined;
  const out: Record<string, number> = {};
  for (const [k, v] of Object.entries(raw)) {
    if (typeof v === "number" && Number.isFinite(v)) out[k] = v;
  }
  return Object.keys(out).length ? out : undefined;
}

export function createDecisionInputToBrainInput(
  input: CreateDecisionInput,
  opts?: { sourceWeightMultiplier?: number | null },
): BrainDecisionInput {
  const meta = input.metadata && typeof input.metadata === "object" ? (input.metadata as Record<string, unknown>) : {};
  const learningRaw = meta.learningSignals;
  const learningSignals = Array.isArray(learningRaw)
    ? learningRaw.filter((x): x is string => typeof x === "string")
    : undefined;

  return {
    source: mapCoreSourceToBrain(input.source as CoreSystemSource),
    entityType: input.entityType,
    entityId: input.entityId ?? null,
    actionType: input.actionType,
    confidenceScore: input.confidenceScore,
    evidenceScore: input.evidenceScore ?? null,
    learningSignals,
    geo: normalizeGeo(meta.geo),
    reason: input.reason,
    expectedImpact: input.expectedImpact ?? null,
    warnings: input.warnings,
    blockers: input.blockers,
    sourceWeight: opts?.sourceWeightMultiplier ?? null,
  };
}
