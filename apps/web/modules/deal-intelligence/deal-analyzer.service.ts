import type { Deal, DealExecutionType, DealParty } from "@prisma/client";

export type DealAnalysisSnapshot = {
  dealKind: "sale" | "lease" | "other";
  executionType: DealExecutionType | null;
  isResidentialContext: boolean;
  partyCount: number;
  hasBroker: boolean;
  jurisdiction: string;
  priceCents: number;
  status: string;
  riskSignals: string[];
};

function inferDealKind(executionType: DealExecutionType | null | undefined): "sale" | "lease" | "other" {
  if (!executionType) return "other";
  if (executionType.includes("lease")) return "lease";
  if (
    executionType.includes("sale") ||
    executionType === "purchase_brokerage" ||
    executionType === "sale_brokerage" ||
    executionType === "amendment" ||
    executionType === "counter_proposal"
  ) {
    return "sale";
  }
  return "other";
}

/**
 * Heuristic deal classification — assists document routing; not a legal determination.
 */
export function analyzeDeal(deal: Deal, parties: Pick<DealParty, "id">[]): DealAnalysisSnapshot {
  const executionType = deal.dealExecutionType ?? null;
  const dealKind = inferDealKind(executionType);
  const isResidentialContext =
    executionType === "residential_sale" ||
    executionType === "divided_coownership_sale" ||
    executionType === "undivided_coownership_sale" ||
    executionType === "residential_lease" ||
    executionType == null;

  const riskSignals: string[] = [];
  if (!deal.brokerId) riskSignals.push("no_assigned_broker");
  if (parties.length < 2) riskSignals.push("incomplete_parties");
  if (!deal.assignedFormPackageKey) riskSignals.push("no_form_package_assigned");

  return {
    dealKind,
    executionType,
    isResidentialContext,
    partyCount: parties.length,
    hasBroker: Boolean(deal.brokerId),
    jurisdiction: deal.jurisdiction ?? "QC",
    priceCents: deal.priceCents,
    status: deal.status,
    riskSignals,
  };
}
