/**
 * Deterministic cohort assignment for partial rollout — visibility only; does not grant execution powers.
 */

import { PlatformRole } from "@prisma/client";
import type { GrowthAutonomyRolloutStage } from "./growth-autonomy.types";
import {
  parseGrowthAutonomyCohortPercentFromEnv,
  resolveEffectiveGrowthAutonomyRolloutStage,
} from "./growth-autonomy-config";

export type GrowthAutonomyCohortKind = "internal" | "cohort_a" | "cohort_b" | "control";

export type GrowthAutonomyCohortResolution = {
  kind: GrowthAutonomyCohortKind;
  /** Whether this viewer receives autonomy snapshot rows (not necessarily full catalog — policy still applies). */
  receivesAutonomySnapshot: boolean;
  /** Stable 0–9999 bucket for debugging / balanced splits. */
  bucket: number;
  /** Human-readable assignment reason (no PII). */
  reason: string;
};

function parseIdSet(envKey: string): Set<string> {
  const raw = process.env[envKey] ?? "";
  return new Set(
    raw
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean),
  );
}

/** Deterministic hash → [0, 9999]. */
export function stableAutonomyBucket(userId: string): number {
  let h = 2166136261;
  for (let i = 0; i < userId.length; i++) {
    h ^= userId.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h) % 10000;
}

/**
 * Optional: first matching role rule wins.
 * Env format: `ROLE:cohort` pairs separated by `;` e.g. `ADMIN:internal;BROKER:cohort_a`
 */
function cohortFromRoleRules(role: PlatformRole): GrowthAutonomyCohortKind | null {
  const raw = process.env.GROWTH_AUTONOMY_COHORT_ROLE_RULES ?? "";
  if (!raw.trim()) return null;
  const segments = raw.split(";");
  for (const seg of segments) {
    const [r, c] = seg.split(":").map((s) => s.trim());
    if (!r || !c) continue;
    if (r === role || r === String(role)) {
      if (c === "internal" || c === "cohort_a" || c === "cohort_b" || c === "control") return c;
    }
  }
  return null;
}

export type ResolveGrowthAutonomyCohortInput = {
  userId: string;
  role: PlatformRole;
  rolloutStage: GrowthAutonomyRolloutStage;
  /** True when internal pilot gate would allow (admin, allowlist, non-prod, debug UI, etc.). */
  internalPilotEligible: boolean;
};

/**
 * Resolve cohort for the autonomy API. Deterministic for the same inputs.
 */
export function resolveGrowthAutonomyCohort(input: ResolveGrowthAutonomyCohortInput): GrowthAutonomyCohortResolution {
  const bucket = stableAutonomyBucket(input.userId);
  const stage = resolveEffectiveGrowthAutonomyRolloutStage(input.rolloutStage);
  const cohortPercent = parseGrowthAutonomyCohortPercentFromEnv();

  const controlIds = parseIdSet("GROWTH_AUTONOMY_COHORT_CONTROL_USER_IDS");
  const cohortAIds = parseIdSet("GROWTH_AUTONOMY_COHORT_A_USER_IDS");
  const cohortBIds = parseIdSet("GROWTH_AUTONOMY_COHORT_B_USER_IDS");

  if (controlIds.has(input.userId)) {
    return {
      kind: "control",
      receivesAutonomySnapshot: false,
      bucket,
      reason: "explicit_control_allowlist",
    };
  }
  if (cohortAIds.has(input.userId)) {
    return {
      kind: "cohort_a",
      receivesAutonomySnapshot: stage !== "off",
      bucket,
      reason: "explicit_cohort_a_allowlist",
    };
  }
  if (cohortBIds.has(input.userId)) {
    return {
      kind: "cohort_b",
      receivesAutonomySnapshot: stage !== "off",
      bucket,
      reason: "explicit_cohort_b_allowlist",
    };
  }

  const roleCohort = cohortFromRoleRules(input.role);
  if (roleCohort) {
    return {
      kind: roleCohort,
      receivesAutonomySnapshot: stage !== "off" && roleCohort !== "control",
      bucket,
      reason: "role_rule",
    };
  }

  if (stage === "off") {
    return {
      kind: "control",
      receivesAutonomySnapshot: false,
      bucket,
      reason: "rollout_off",
    };
  }

  if (stage === "internal") {
    if (input.internalPilotEligible) {
      return {
        kind: "internal",
        receivesAutonomySnapshot: true,
        bucket,
        reason: "internal_pilot",
      };
    }
    return {
      kind: "control",
      receivesAutonomySnapshot: false,
      bucket,
      reason: "internal_non_pilot",
    };
  }

  if (stage === "full") {
    return {
      kind: "cohort_a",
      receivesAutonomySnapshot: true,
      bucket,
      reason: "full_rollout_default_treatment",
    };
  }

  // partial
  if (input.internalPilotEligible) {
    return {
      kind: "internal",
      receivesAutonomySnapshot: true,
      bucket,
      reason: "internal_pilot_partial",
    };
  }

  if (cohortPercent <= 0) {
    return {
      kind: "control",
      receivesAutonomySnapshot: false,
      bucket,
      reason: "partial_percent_zero_internal_only",
    };
  }

  const percentile = bucket % 100;
  if (percentile >= cohortPercent) {
    return {
      kind: "control",
      receivesAutonomySnapshot: false,
      bucket,
      reason: "hash_bucket_control",
    };
  }

  const ab = Math.floor(bucket / 100) % 2 === 0;
  return {
    kind: ab ? "cohort_a" : "cohort_b",
    receivesAutonomySnapshot: true,
    bucket,
    reason: "hash_bucket_treatment",
  };
}
