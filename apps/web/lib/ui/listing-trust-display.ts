import type { MissingItemRow } from "@/components/trust/MissingItemsList";
import type { VerificationBadgeVariant } from "@/components/trust/VerificationBadge";

/** Pure display helpers — no scoring rules; maps existing strings to UI tiers. */

export function categorizeListingReason(reason: string, index: number): MissingItemRow {
  const s = reason.toLowerCase();
  const severity =
    s.includes("missing") ||
    s.includes("required") ||
    s.includes("upload") ||
    s.includes("must ") ||
    s.includes("no document")
      ? ("danger" as const)
      : ("warning" as const);
  return { id: `reason-${index}`, label: reason, severity };
}

export function buildTrustBreakdownFromReasons(
  reasons: string[],
  trustScore: number | null
): { missing: MissingItemRow[]; warnings: MissingItemRow[]; passed: MissingItemRow[] } {
  const missing: MissingItemRow[] = [];
  const warnings: MissingItemRow[] = [];
  reasons.forEach((r, i) => {
    const row = categorizeListingReason(r, i);
    if (row.severity === "danger") missing.push(row);
    else warnings.push(row);
  });
  const passed: MissingItemRow[] = [];
  if (trustScore != null && trustScore >= 65) {
    passed.push({ id: "pass-1", label: "Declaration and documents support a strong trust signal", severity: "success" });
  }
  if (trustScore != null && trustScore >= 45 && trustScore < 65) {
    passed.push({ id: "pass-2", label: "Core listing data is present — tighten gaps below to lift score", severity: "success" });
  }
  return { missing, warnings, passed };
}

export function resolveListingVerificationBadge(params: {
  ux: "draft" | "pending_verification" | "active" | "rejected";
  identityVerified: boolean;
  trustScore: number | null;
}): VerificationBadgeVariant {
  if (params.ux === "active" && params.identityVerified) return "verified";
  if (params.trustScore == null) return "pending";
  if (params.trustScore >= 70) return "high_trust";
  if (params.trustScore >= 40) return "medium";
  return "low";
}
