/**
 * Deterministic fingerprints — group the same logical finding across evaluations.
 * Uses canonical policy rule id + domain (stable in `growth-policy.service`) plus normalized text.
 */

import { createHash } from "node:crypto";

import type { GrowthPolicyResult } from "@/modules/growth/policy/growth-policy.types";

function normalizeWhitespace(s: string): string {
  return s.trim().toLowerCase().replace(/\s+/g, " ");
}

function coreReasonSnippet(description: string): string {
  const n = normalizeWhitespace(description);
  return n.slice(0, 160);
}

/**
 * Stable across repeated evaluations of the same rule; ignores timestamps and request ids.
 */
export function buildGrowthPolicyFingerprint(policy: GrowthPolicyResult): string {
  const basis = [
    policy.domain,
    policy.id,
    normalizeWhitespace(policy.title),
    coreReasonSnippet(policy.description),
  ].join("|");
  const hash = createHash("sha256").update(basis, "utf8").digest("hex").slice(0, 24);
  return `v1:${policy.domain}:${policy.id}:${hash}`;
}
