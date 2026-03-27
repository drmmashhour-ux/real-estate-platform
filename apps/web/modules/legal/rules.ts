/**
 * Global legal rules layer — single entry for hubs, checkpoints, and compliance checks.
 * Delegates signature / gate validation to `legal-engine` + `legal-snapshot`.
 */

import {
  getRequiredForms,
  validateForms,
  type ComplianceSnapshot,
  type LegalActionContext,
  type LegalFormRequirement,
} from "@/modules/legal/legal-engine";
import {
  buildComplianceSnapshotForBnhubLongPublish,
  buildComplianceSnapshotForBnhubShortPublish,
  buildComplianceSnapshotForBroker,
  buildComplianceSnapshotForBuyerHub,
  buildComplianceSnapshotForFsboSeller,
  buildComplianceSnapshotForMortgageHub,
} from "@/modules/legal/legal-snapshot";

/** Supported high-level rule contexts (English product / ops naming). */
export type LegalRulesContext =
  | { kind: "buyer_contact"; fsboListingId: string }
  | { kind: "buyer_offer"; listingId: string }
  | { kind: "seller_publish"; fsboListingId: string }
  | { kind: "landlord_publish"; listingId: string }
  | { kind: "host_publish"; listingId: string }
  | { kind: "rental_booking"; listingId: string; mode: "short_term_guest" | "long_term_tenant" }
  | { kind: "broker_lead_access" }
  | { kind: "mortgage_request" };

export type LegalStep = {
  id: string;
  title: string;
  description: string;
  order: number;
};

export type LegalDocumentRef = {
  id: string;
  label: string;
  required: boolean;
  notes?: string;
};

export type LegalDisclosureRef = {
  id: string;
  title: string;
  summary: string;
};

export type LegalReadinessResult = ReturnType<typeof validateForms>;

function mapRulesToAction(ctx: LegalRulesContext): LegalActionContext {
  switch (ctx.kind) {
    case "buyer_contact":
      return { context: "buyer_contact", fsboListingId: ctx.fsboListingId };
    case "buyer_offer":
      return { context: "buyer_offer", listingId: ctx.listingId };
    case "seller_publish":
      return { context: "seller_listing", fsboListingId: ctx.fsboListingId };
    case "landlord_publish":
      return { context: "rental_long", listingId: ctx.listingId };
    case "host_publish":
      return { context: "rental_short_publish", listingId: ctx.listingId };
    case "rental_booking":
      return ctx.mode === "short_term_guest"
        ? { context: "rental_short_booking", listingId: ctx.listingId }
        : { context: "tenant_confirmation", listingId: ctx.listingId };
    case "broker_lead_access":
      return { context: "broker_activity" };
    case "mortgage_request":
      return { context: "mortgage_request" };
  }
}

export async function loadComplianceSnapshotForRules(
  ctx: LegalRulesContext,
  userId: string
): Promise<ComplianceSnapshot> {
  switch (ctx.kind) {
    case "seller_publish":
      return buildComplianceSnapshotForFsboSeller(userId, ctx.fsboListingId);
    case "buyer_contact":
    case "buyer_offer":
    case "rental_booking":
      return buildComplianceSnapshotForBuyerHub(userId);
    case "broker_lead_access":
      return buildComplianceSnapshotForBroker(userId);
    case "mortgage_request":
      return buildComplianceSnapshotForMortgageHub(userId);
    case "landlord_publish":
      return buildComplianceSnapshotForBnhubLongPublish(ctx.listingId);
    case "host_publish":
      return buildComplianceSnapshotForBnhubShortPublish(ctx.listingId);
  }
}

/**
 * Ordered checklist of legal / operational steps for UI and audits (not all are gate-blocked in code).
 */
export function getRequiredLegalSteps(ctx: LegalRulesContext): LegalStep[] {
  const base: LegalStep[] = [
    {
      id: "informed_decision",
      order: 1,
      title: "Material information before commitment",
      description:
        "Users should not take transaction-critical actions without the information needed for an informed decision.",
    },
    {
      id: "traceability",
      order: 2,
      title: "Traceability",
      description: "Material facts shown publicly should be supportable; platform workflows favour verification and records.",
    },
  ];

  switch (ctx.kind) {
    case "buyer_contact":
      return [
        ...base,
        {
          id: "buyer_ack",
          order: 3,
          title: "Buyer acknowledgment",
          description: "Acknowledge limitations of listings and the role of independent advice.",
        },
        {
          id: "immo_contact",
          order: 4,
          title: "ImmoContact logging",
          description: "Contact events are logged with listing, user, channel, and hub for audit.",
        },
      ];
    case "buyer_offer":
      return [
        ...base,
        {
          id: "buyer_ack",
          order: 3,
          title: "Buyer acknowledgment",
          description: "Signed before high-intent buyer actions.",
        },
        {
          id: "offer_precheck",
          order: 4,
          title: "Offer-style review",
          description: "Confirm review of listing details, available disclosures, and financing assumptions.",
        },
      ];
    case "seller_publish":
      return [
        ...base,
        {
          id: "identity_authority",
          order: 3,
          title: "Identity and authority",
          description: "Verify identity and authority to market the property where the product enforces it.",
        },
        {
          id: "seller_declaration",
          order: 4,
          title: "Seller declaration",
          description: "Complete mandatory disclosure where applicable before activation.",
        },
        {
          id: "structured_description",
          order: 5,
          title: "Structured listing data",
          description: "Address, cadastre/lot where applicable, area, inclusions/exclusions, taxes/charges.",
        },
      ];
    case "landlord_publish":
      return [
        ...base,
        {
          id: "ownership_authority",
          order: 3,
          title: "Ownership / authority",
          description: "Confirm right to advertise and enter tenancy arrangements.",
        },
        {
          id: "rental_terms_disclosure",
          order: 4,
          title: "Rental terms",
          description: "Material rent, term, and deposit information disclosed before commitment.",
        },
      ];
    case "host_publish":
      return [
        ...base,
        {
          id: "host_agreement",
          order: 3,
          title: "Host agreement & accuracy",
          description: "Host terms, condition and amenity accuracy, house rules and safety standards.",
        },
      ];
    case "rental_booking":
      return ctx.mode === "short_term_guest"
        ? [
            ...base,
            {
              id: "guest_ack",
              order: 3,
              title: "Guest acknowledgment",
              description: "Rules, cancellation, conduct, and damage framework before payment.",
            },
          ]
        : [
            ...base,
            {
              id: "tenant_ack",
              order: 3,
              title: "Tenant acknowledgment",
              description: "Long-term rental information reviewed before commitment.",
            },
          ];
    case "broker_lead_access":
      return [
        ...base,
        {
          id: "broker_agreement",
          order: 3,
          title: "Broker agreement & collaboration",
          description: "Signed broker terms including collaboration and ImmoContact traceability.",
        },
      ];
    case "mortgage_request":
      return [
        ...base,
        {
          id: "mortgage_disclosure",
          order: 3,
          title: "Mortgage disclosure",
          description: "Estimates are informational; not final approval.",
        },
      ];
  }
}

export function getRequiredContracts(ctx: LegalRulesContext): LegalFormRequirement[] {
  return getRequiredForms(mapRulesToAction(ctx));
}

export function getRequiredDisclosures(ctx: LegalRulesContext): LegalDisclosureRef[] {
  const action = mapRulesToAction(ctx);
  const forms = getRequiredForms(action);
  return forms.map((f) => ({
    id: f.key,
    title: f.label,
    summary: `Source: ${f.source}; mandatory: ${f.mandatory}`,
  }));
}

export function getRequiredDocuments(ctx: LegalRulesContext): LegalDocumentRef[] {
  switch (ctx.kind) {
    case "seller_publish":
      return [
        { id: "identity", label: "Identity verification (where required)", required: true },
        { id: "title_authority", label: "Title / ownership evidence or confirmation", required: true },
        { id: "seller_declaration_doc", label: "Seller declaration (attached to listing when applicable)", required: true },
        { id: "annexes", label: "Annexes referenced in listing agreement", required: false },
      ];
    case "landlord_publish":
      return [
        { id: "ownership", label: "Ownership or management authority", required: true },
        { id: "lease_framework", label: "Draft lease / key terms documentation", required: false },
      ];
    case "host_publish":
      return [
        { id: "host_id", label: "Host verification (platform flow)", required: true },
        { id: "property_rules", label: "House rules & safety disclosures", required: true },
      ];
    case "buyer_offer":
      return [
        { id: "offer_terms", label: "Written offer or LOI as applicable", required: false, notes: "Jurisdiction-specific." },
      ];
    case "mortgage_request":
      return [
        { id: "income_support", label: "Proof of income / capacity (when requested)", required: false },
      ];
    default:
      return [];
  }
}

export async function validateLegalReadiness(
  ctx: LegalRulesContext,
  userId: string
): Promise<LegalReadinessResult> {
  const action = mapRulesToAction(ctx);
  const snap = await loadComplianceSnapshotForRules(ctx, userId);
  return validateForms(action, snap);
}

export { mapRulesToAction };
