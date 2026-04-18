import type { Deal } from "@prisma/client";
import { analyzeDeal } from "./deal-analyzer.service";
import { inferDocumentRequirements } from "./document-requirements.service";

export type DraftingContextBundle = {
  queryText: string;
  summary: string;
  metadata: Record<string, string | number | boolean | null>;
};

/**
 * Builds a retrieval query string for legal-knowledge search from deal state.
 */
export function buildDraftingQueryFromDeal(deal: Deal & { dealParties?: { id: string }[] }): string {
  const parties = deal.dealParties ?? [];
  const analysis = analyzeDeal(deal, parties);
  const req = inferDocumentRequirements(deal, parties);
  return [
    `Quebec ${analysis.dealKind} residential brokerage`,
    `package ${req.packageKey}`,
    `status ${deal.status}`,
    deal.assignedFormPackageKey ? `assigned ${deal.assignedFormPackageKey}` : "",
    `jurisdiction ${analysis.jurisdiction}`,
  ]
    .filter(Boolean)
    .join(" ");
}

export function buildDraftingContextBundle(deal: Deal & { dealParties?: { id: string }[] }): DraftingContextBundle {
  const parties = deal.dealParties ?? [];
  const analysis = analyzeDeal(deal, parties);
  const req = inferDocumentRequirements(deal, parties);
  return {
    queryText: buildDraftingQueryFromDeal(deal),
    summary: `${analysis.dealKind} · ${req.packageKey} · ${parties.length} parties`,
    metadata: {
      executionType: analysis.executionType,
      packageKey: req.packageKey,
      partyCount: analysis.partyCount,
      status: deal.status,
    },
  };
}
