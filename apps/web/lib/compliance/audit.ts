import { createHash } from "crypto";

export function buildAuditNumber() {
  const now = new Date();
  return `AUD-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}-${Date.now()}`;
}

export function buildBundleNumber() {
  const now = new Date();
  return `BND-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}-${Date.now()}`;
}

export function computeImmutableHash(payload: unknown) {
  return createHash("sha256").update(JSON.stringify(payload)).digest("hex");
}

export function buildAuditSummary(input: {
  moduleKey: string;
  entityType: string;
  actionType: string;
  summary: string;
}) {
  return `[${input.moduleKey}] ${input.entityType} ${input.actionType} — ${input.summary}`;
}

export function canOpenInspectionSession(input: { reviewerType: string; revokedAt?: Date | null }) {
  if (input.revokedAt) return false;
  return ["internal", "agency_admin", "regulator", "oversight"].includes(input.reviewerType);
}

/**
 * Agency bundles must only aggregate records whose `ownerType` / `ownerId` match the bundle scope.
 * Solo broker bundles use that broker’s owner id; do not merge agency streams with solo streams.
 */
export function assertAuditOwnerMatchesBundleScope(input: {
  recordOwnerType: string;
  recordOwnerId: string;
  bundleOwnerType: string;
  bundleOwnerId: string;
}) {
  if (input.recordOwnerType !== input.bundleOwnerType || input.recordOwnerId !== input.bundleOwnerId) {
    throw new Error("AUDIT_OWNER_SCOPE_MISMATCH");
  }
}
