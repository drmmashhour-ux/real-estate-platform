import { createHash } from "node:crypto";

/**
 * Normalizes recommended payload to key fields only — stable ordering, no nested object expansion.
 */
function normalizePayloadForFingerprint(payload: Record<string, unknown> | null | undefined): string {
  if (!payload || typeof payload !== "object") return "";
  const keys = Object.keys(payload).sort();
  const slim: Record<string, string | number | boolean> = {};
  for (const k of keys) {
    const v = payload[k];
    if (v === null || v === undefined) continue;
    if (typeof v === "object") {
      slim[k] = "[nested]";
      continue;
    }
    if (typeof v === "string" || typeof v === "number" || typeof v === "boolean") {
      slim[k] = v;
    }
  }
  return JSON.stringify(slim);
}

export type ActionFingerprintInput = {
  domain: string;
  entityType: string;
  entityId: string | null;
  actionType: string;
  recommendedPayload?: Record<string, unknown> | null;
};

/**
 * Deterministic fingerprint: same problem → same hash (SHA-256 hex).
 */
export function computeActionFingerprint(input: ActionFingerprintInput): string {
  const base = [
    input.domain.trim().toLowerCase(),
    input.entityType.trim().toLowerCase(),
    (input.entityId ?? "").trim(),
    input.actionType.trim(),
    normalizePayloadForFingerprint(input.recommendedPayload ?? undefined),
  ].join("\u001f");
  return createHash("sha256").update(base, "utf8").digest("hex");
}
