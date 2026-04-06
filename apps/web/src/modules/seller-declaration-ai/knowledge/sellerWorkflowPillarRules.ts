export type SellerDeclarationVariant = "DS" | "DSD";

export type SellerWorkflowRuleSummary = {
  declarationVariant: SellerDeclarationVariant | null;
  representationMode: "fsbo" | "broker" | "unknown";
  blocks: string[];
  warnings: string[];
};

function asLower(value: unknown): string {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}

function asBool(value: unknown): boolean {
  return value === true || value === "true";
}

export function resolveSellerDeclarationVariant(payload: Record<string, unknown>): SellerDeclarationVariant | null {
  const propertyType = asLower(payload.property_type);
  const ownershipType = asLower(payload.ownership_type);
  const isCondo = asBool(payload.isCondo) || propertyType === "condo";

  if (isCondo || ownershipType === "divided_coownership" || ownershipType === "divided co-ownership") {
    return "DSD";
  }
  if (ownershipType === "undivided_coownership" || ownershipType === "undivided co-ownership") {
    return "DS";
  }
  if (propertyType) {
    return "DS";
  }
  return null;
}

export function evaluateSellerWorkflowPillarRules(
  payload: Record<string, unknown>
): SellerWorkflowRuleSummary {
  const blocks: string[] = [];
  const warnings: string[] = [];

  const propertyType = asLower(payload.property_type);
  const propertyAddress = asLower(payload.property_address);
  const representationMode = (() => {
    const raw = asLower(payload.representation_mode);
    if (raw === "fsbo" || raw === "sell_by_yourself" || raw === "sell by yourself") return "fsbo" as const;
    if (raw === "broker" || raw === "with_broker" || raw === "sell with broker") return "broker" as const;
    return "unknown" as const;
  })();
  const declarationVariant = resolveSellerDeclarationVariant(payload);

  if (!propertyAddress) blocks.push("Property address is required before the seller declaration can be validated.");
  if (!propertyType) blocks.push("Property type is required to determine the correct declaration and contract path.");
  if (!declarationVariant && propertyType) {
    blocks.push("The platform could not determine whether this file requires the DS or DSD declaration path.");
  }

  if (representationMode === "broker") {
    if (!asBool(payload.brokerage_contract_started)) {
      warnings.push(
        "Brokered sale path should start with a brokerage contract workflow before advancing to full transaction steps."
      );
    }
    if (!asBool(payload.seller_declaration_jointly_completed)) {
      warnings.push(
        "For brokered sale, DS/DSD completion should be treated as a jointly completed seller declaration step."
      );
    }
  }

  if (declarationVariant === "DSD") {
    const condoDocsReady =
      asBool(payload.condo_syndicate_documents_available) ||
      asBool(payload.condoSyndicateDocumentsAvailable);
    const financialsReady =
      asBool(payload.condo_financial_statements_available) ||
      asBool(payload.condoFinancialStatementsAvailable);

    if (!condoDocsReady) {
      warnings.push(
        "Divided co-ownership path should collect declaration of co-ownership and related condo/syndicate documents."
      );
    }
    if (!financialsReady) {
      warnings.push(
        "Divided co-ownership path should collect financial statements and contingency-fund context before final approval."
      );
    }
  }

  if (asBool(payload.tenant_present) && !asLower(payload.lease_details)) {
    warnings.push("Income or tenant-occupied property should include lease details before final transaction review.");
  }

  if (asBool(payload.new_construction_flag) || asLower(payload.transaction_context) === "new_construction") {
    warnings.push(
      "New or on-plan residential construction may require a preliminary contract instead of the standard promise to purchase workflow."
    );
  }

  return {
    declarationVariant,
    representationMode,
    blocks,
    warnings,
  };
}
