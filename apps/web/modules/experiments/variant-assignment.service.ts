import { createHash } from "node:crypto";
import { prisma } from "@/lib/db";
import { abTestingFlags, engineFlags } from "@/config/feature-flags";
import type { AbMetadataPayload } from "./ab-testing.types";
import type { ExperimentDomain } from "./ab-testing.types";

function pickVariantKey(variantKeys: string[], salt: string): string {
  if (variantKeys.length === 0) return "control";
  const h = createHash("sha256").update(salt).digest();
  const n = h.readUInt32BE(0) / 0xffffffff;
  return variantKeys[Math.min(variantKeys.length - 1, Math.floor(n * variantKeys.length))]!;
}

function allowAssignment(): boolean {
  return abTestingFlags.abTestingV1 || engineFlags.experimentsV1;
}

export type AssignVariantInput = {
  experimentId: string;
  sessionId?: string | null;
  userId?: string | null;
  anonymousId?: string | null;
};

export type AssignVariantResult =
  | {
      ok: true;
      experimentId: string;
      variantId: string;
      variantKey: string;
      domain: ExperimentDomain;
      ab: AbMetadataPayload;
    }
  | { ok: false; reason: string; fallbackVariantKey?: string };

/**
 * Deterministic sticky assignment — same session always maps to same variant.
 * Paused / completed / archived experiments do not assign new traffic.
 */
export async function assignVariant(input: AssignVariantInput): Promise<AssignVariantResult> {
  if (!allowAssignment()) {
    return { ok: false, reason: "feature_off" };
  }

  const sessionKey = (input.sessionId ?? input.userId ?? input.anonymousId ?? "").trim();
  if (!sessionKey) {
    return { ok: false, reason: "missing_session" };
  }

  const experiment = await prisma.experiment.findUnique({
    where: { id: input.experimentId },
    include: { variants: true },
  });

  if (!experiment || experiment.status !== "running") {
    const control = experiment?.variants.find((v) => v.variantKey === "control") ?? experiment?.variants[0];
    return {
      ok: false,
      reason: experiment ? `status_${experiment.status}` : "not_found",
      fallbackVariantKey: control?.variantKey ?? "control",
    };
  }

  const existing = await prisma.experimentAssignment.findUnique({
    where: {
      experimentId_sessionId: { experimentId: experiment.id, sessionId: sessionKey.slice(0, 128) },
    },
    include: { variant: true },
  });
  if (existing) {
    const domain = (experiment.targetSurface as ExperimentDomain) || "landing";
    return {
      ok: true,
      experimentId: experiment.id,
      variantId: existing.variant.id,
      variantKey: existing.variant.variantKey,
      domain,
      ab: {
        experimentId: experiment.id,
        variantId: existing.variant.id,
        variantKey: existing.variant.variantKey,
        domain,
      },
    };
  }

  const keys = experiment.variants.map((v) => v.variantKey).sort();
  const salt = `${experiment.id}:${sessionKey}:${input.userId ?? ""}`;
  const variantKey = pickVariantKey(keys, salt);
  const variant = experiment.variants.find((v) => v.variantKey === variantKey) ?? experiment.variants[0];
  if (!variant) {
    return { ok: false, reason: "no_variants" };
  }

  await prisma.experimentAssignment.create({
    data: {
      experimentId: experiment.id,
      variantId: variant.id,
      sessionId: sessionKey.slice(0, 128),
      userId: input.userId ?? null,
    },
  });

  const domain = (experiment.targetSurface as ExperimentDomain) || "landing";
  return {
    ok: true,
    experimentId: experiment.id,
    variantId: variant.id,
    variantKey: variant.variantKey,
    domain,
    ab: {
      experimentId: experiment.id,
      variantId: variant.id,
      variantKey: variant.variantKey,
      domain,
    },
  };
}
