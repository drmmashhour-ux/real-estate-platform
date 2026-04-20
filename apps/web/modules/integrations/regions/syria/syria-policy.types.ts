/** Syria preview policy domain types — read-only; advisory only (no Québec / FSBO rules). */

export type SyriaPreviewPolicyDecision =
  /** Preview cannot be relied on — region/adapter/feature gate. */
  | "blocked_for_region"
  | "requires_local_approval"
  | "caution_preview"
  | "allow_preview";

export type SyriaPreviewPolicyResult = {
  decision: SyriaPreviewPolicyDecision;
  rationale: string;
};
