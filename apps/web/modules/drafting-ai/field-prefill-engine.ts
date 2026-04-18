import type { Deal } from "@prisma/client";
import type { LegalSourceAttribution } from "@/modules/legal-knowledge/legal-knowledge.types";
import { BROKER_REVIEW_LABEL } from "@/modules/legal-knowledge/legal-knowledge.types";

export type FieldPrefillRow = {
  fieldKey: string;
  proposedValue: string | number | null;
  source: LegalSourceAttribution;
  confidence: number;
  requiresBrokerReview: typeof BROKER_REVIEW_LABEL;
};

/**
 * Maps non-sensitive deal fields to common execution labels — broker must verify against official forms.
 */
export function buildFieldPrefillProposal(deal: Deal): FieldPrefillRow[] {
  const meta =
    deal.executionMetadata && typeof deal.executionMetadata === "object"
      ? (deal.executionMetadata as Record<string, unknown>)
      : {};

  const rows: FieldPrefillRow[] = [
    {
      fieldKey: "transaction.price_cad",
      proposedValue: deal.priceCents / 100,
      source: {
        source: "Deal record",
        page: null,
        section: "Recorded price",
        explanation: "Derived from platform deal.priceCents — confirm against accepted offer / deed instructions.",
      },
      confidence: 0.9,
      requiresBrokerReview: BROKER_REVIEW_LABEL,
    },
    {
      fieldKey: "deal.status",
      proposedValue: deal.status,
      source: {
        source: "Deal record",
        page: null,
        section: "Pipeline status",
        explanation: "Internal workflow status — not equivalent to juridical act completion.",
      },
      confidence: 0.85,
      requiresBrokerReview: BROKER_REVIEW_LABEL,
    },
  ];

  if (typeof meta.depositCents === "number") {
    rows.push({
      fieldKey: "transaction.deposit_cad",
      proposedValue: meta.depositCents / 100,
      source: {
        source: "Execution metadata",
        page: null,
        section: "depositCents",
        explanation: "From executionMetadata — verify against promise-to-purchase and trust instructions.",
      },
      confidence: 0.65,
      requiresBrokerReview: BROKER_REVIEW_LABEL,
    });
  }

  return rows;
}
