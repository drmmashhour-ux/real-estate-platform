import type { Deal } from "@prisma/client";
import type { CanonicalDealShape } from "../source-paths/canonical-deal-shape";
import { OACIQ_DEPENDENCY_RULES } from "./dependency-rules";
import { WORKFLOW_FORM_HINTS } from "./workflow-links";

export type DependencyEngineResult = {
  requiredForms: string[];
  recommendedForms: string[];
  blockingMissingForms: string[];
  notes: string[];
};

export function runDependencyEngine(
  deal: Deal,
  canonical: CanonicalDealShape,
  activeFormKeys: string[],
): DependencyEngineResult {
  const keys = new Set(activeFormKeys.map((k) => k.toUpperCase()));
  const hasPpRef = Boolean(
    canonical.deal.meta.principalFormNumber?.trim() ||
      canonical.deal.documents.ppFormNumber?.trim() ||
      deal.dealCode?.trim(),
  );
  const isDivided = deal.dealExecutionType === "divided_coownership_sale";
  const meta = (deal.executionMetadata && typeof deal.executionMetadata === "object"
    ? deal.executionMetadata
    : {}) as Record<string, unknown>;
  const hasExistingLoan = Boolean(meta.existingLoanBalance ?? meta.loanInfo ?? canonical.deal.financing.existingLoanBalance);

  const requiredForms: string[] = [];
  const recommendedForms: string[] = [];
  const blockingMissingForms: string[] = [];
  const notes: string[] = [];

  const wfKey = deal.dealExecutionType ?? "default";
  const hint = WORKFLOW_FORM_HINTS[wfKey] ?? WORKFLOW_FORM_HINTS.default;
  requiredForms.push(...hint.required);
  recommendedForms.push(...hint.recommended);
  notes.push(...hint.notes);

  for (const rule of OACIQ_DEPENDENCY_RULES) {
    if (!rule.when({ activeFormKeys: keys, hasPpRef, isDivided, hasExistingLoan })) continue;
    blockingMissingForms.push(...rule.blockingMissingForms);
    recommendedForms.push(...rule.recommendedForms);
    notes.push(...rule.notes);
  }

  const dedupe = (xs: string[]) => Array.from(new Set(xs));
  return {
    requiredForms: dedupe(requiredForms),
    recommendedForms: dedupe(recommendedForms),
    blockingMissingForms: dedupe(blockingMissingForms),
    notes: dedupe(notes),
  };
}
