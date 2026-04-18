import type { DealExecutionType, ResidentialTransactionType } from "@prisma/client";

export type ResidentialDealLinkResult =
  | { ok: true; transactionType: ResidentialTransactionType; warnings: string[] }
  | { ok: false; error: string; warnings: string[] };

const OUT_OF_SCOPE: DealExecutionType[] = ["commercial_lease", "income_property"];

const MAP: Partial<Record<DealExecutionType, ResidentialTransactionType>> = {
  residential_sale: "residential_sale",
  divided_coownership_sale: "divided_coownership",
  undivided_coownership_sale: "undivided_coownership",
  residential_lease: "residential_lease",
  purchase_brokerage: "residential_purchase_representation",
  sale_brokerage: "residential_listing_side",
};

/**
 * Maps LECIPM deal execution metadata to residential commission case categories.
 * Commercial / income-property execution types are rejected for this product phase.
 */
export function resolveResidentialTransactionFromDeal(deal: {
  dealExecutionType: DealExecutionType | null;
}): ResidentialDealLinkResult {
  const warnings: string[] = [];
  const t = deal.dealExecutionType;

  if (!t) {
    warnings.push(
      "Deal has no dealExecutionType — using residential_sale as a provisional commission label; manual classification recommended.",
    );
    return { ok: true, transactionType: "residential_sale", warnings };
  }

  if (OUT_OF_SCOPE.includes(t)) {
    return {
      ok: false,
      error:
        "This deal type is out of scope for the residential commission engine in the current release (commercial / income-property).",
      warnings,
    };
  }

  const mapped = MAP[t];
  if (mapped) {
    return { ok: true, transactionType: mapped, warnings };
  }

  if (t === "amendment" || t === "counter_proposal") {
    warnings.push(
      `Deal execution type "${t}" does not map to a dedicated residential commission category — using residential_sale as provisional label.`,
    );
    return { ok: true, transactionType: "residential_sale", warnings };
  }

  warnings.push(
    `Unmapped dealExecutionType "${String(t)}" — using residential_sale as provisional label; review before approval.`,
  );
  return { ok: true, transactionType: "residential_sale", warnings };
}
