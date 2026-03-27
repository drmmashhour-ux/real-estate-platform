import type { DecisionSnapshot } from "@/lib/decision-engine/buildDecisionSnapshot";

export type DecisionAction = {
  id: string;
  label: string;
  href: string;
};

/**
 * Deterministic next actions from issue codes + explanation (no LLM).
 */
export function buildDecisionActions(listingId: string, snapshot: DecisionSnapshot | null): DecisionAction[] {
  const wizard = `/dashboard/seller/create?id=${encodeURIComponent(listingId)}`;
  const out: DecisionAction[] = [];
  const codes = new Set(snapshot?.trust.issueCodes ?? []);

  if (codes.has("MEDIA_NO_EXTERIOR_TAG") || codes.has("MEDIA_NONE") || codes.has("MEDIA_SPARSE")) {
    out.push({ id: "photos", label: "Add exterior photo", href: wizard });
  }
  if (codes.has("CONDO_MISSING_UNIT") || codes.has("ADDR_INCOMPLETE")) {
    out.push({ id: "address", label: "Fix address & unit", href: wizard });
  }
  if (codes.has("DECLARATION_INCOMPLETE") || codes.has("DECLARATION_PARTIAL")) {
    out.push({ id: "decl", label: "Complete declaration", href: wizard });
  }
  if (codes.has("IDENTITY_NONE") || codes.has("IDENTITY_PARTIAL") || codes.has("IDENTITY_PENDING")) {
    out.push({ id: "id", label: "Complete identity verification", href: wizard });
  }

  for (const line of snapshot?.explanation.nextActions ?? []) {
    if (out.length >= 6) break;
    const id = `ex-${out.length}`;
    if (!out.some((a) => a.label === line)) out.push({ id, label: line.slice(0, 80), href: wizard });
  }

  if (out.length === 0) {
    out.push({ id: "review", label: "Review listing in wizard", href: wizard });
  }

  return out.slice(0, 6);
}
