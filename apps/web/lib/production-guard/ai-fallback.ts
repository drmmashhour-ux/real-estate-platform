import { isAiFallbackEnforced } from "./production-mode";
import { recordProductionGuardAudit } from "./audit-service";

const FALLBACK_BY_FORM: Record<string, Record<string, unknown>> = {
  lecipm_promise_to_purchase: {
    buyerLegalName: "TBD",
    sellerLegalName: "TBD",
    propertyCivicAddress: "TBD",
    offerPriceCents: 1,
    occupancyDate: new Date().toISOString().slice(0, 10),
    includesMovableProperty: false,
    titleInsuranceRequested: false,
    jurisdiction_clause:
      "This instrument is governed by the laws applicable in the Province of Quebec. The parties attorn to the jurisdiction of the courts of Quebec.",
    financing_condition_standard:
      "This offer is conditional upon the Buyer obtaining, on terms acceptable to the Buyer, a written commitment for purchase financing within the agreed deadline.",
  },
  lecipm_brokerage_ack: {
    brokerLicenseNumber: "TBD",
    agencyName: "TBD",
    agency_relationship_summary:
      "The broker acknowledges the duty to disclose agency relationships in accordance with applicable regulations. This summary is informational and does not replace mandatory OACIQ forms.",
  },
};

/**
 * Deterministic base-template facts when AI generation fails (production-enforced).
 */
export function getAiFallbackFacts(formKey: string, userFacts: Record<string, unknown>): Record<string, unknown> {
  const base = FALLBACK_BY_FORM[formKey] ?? {};
  return { ...base, ...userFacts };
}

export function shouldUseAiFallback(): boolean {
  return isAiFallbackEnforced();
}

export async function recordAiFallbackUsed(input: {
  dealId?: string | null;
  actorUserId?: string | null;
  formKey: string;
}): Promise<void> {
  await recordProductionGuardAudit({
    dealId: input.dealId,
    actorUserId: input.actorUserId,
    action: "ai_fallback_used",
    entityType: "form",
    entityId: input.formKey,
  });
}
