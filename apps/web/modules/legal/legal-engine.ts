/**
 * Global legal / compliance engine — maps hubs and actions to required forms and validation rules.
 * Integrates with DB-backed signatures (`LegalFormSignature`), contracts, and existing seller verification.
 */

import { legalEnforcementDisabled } from "@/modules/legal/legal-enforcement";

/** Canonical form keys (align with `LegalFormSignature.formKey`). */
export const LEGAL_FORM_KEYS = {
  SELLER_DECLARATION: "SELLER_DECLARATION",
  SELLER_AGREEMENT: "SELLER_AGREEMENT",
  PLATFORM_TERMS: "PLATFORM_TERMS",
  BROKER_AGREEMENT: "BROKER_AGREEMENT",
  RENTAL_AGREEMENT: "RENTAL_AGREEMENT",
  HOST_AGREEMENT: "HOST_AGREEMENT",
  BUYER_ACKNOWLEDGMENT: "BUYER_ACKNOWLEDGMENT",
  MORTGAGE_DISCLOSURE: "MORTGAGE_DISCLOSURE",
  GUEST_ACKNOWLEDGMENT: "GUEST_ACKNOWLEDGMENT",
  TENANT_ACKNOWLEDGMENT: "TENANT_ACKNOWLEDGMENT",
} as const;

export type LegalFormKey = (typeof LEGAL_FORM_KEYS)[keyof typeof LEGAL_FORM_KEYS];

/** High-level contexts for `getRequiredForms` / audits. */
export type LegalContextName =
  | "seller_listing"
  | "buyer_offer"
  | "buyer_contact"
  | "rental_long"
  | "rental_short"
  | "broker_activity"
  | "mortgage_request"
  | "tenant_confirmation";

export type LegalActionContext =
  | { context: "seller_listing"; fsboListingId: string }
  | { context: "buyer_offer"; listingId: string }
  | { context: "buyer_contact"; fsboListingId: string }
  | { context: "rental_long"; listingId: string }
  | { context: "rental_short_publish"; listingId: string }
  | { context: "rental_short_booking"; listingId: string }
  | { context: "broker_activity" }
  | { context: "mortgage_request" }
  | { context: "tenant_confirmation"; listingId: string };

/**
 * `buyer_contact` readiness uses a global buyer signature (`buyer_hub` / empty id in DB);
 * this value is only for typed actions and audits when no FSBO listing is in scope.
 */
export const BUYER_CONTACT_GLOBAL_FSBO_LISTING_ID = "__buyer_hub_global__";

export type LegalFormRequirement = {
  key: LegalFormKey;
  label: string;
  mandatory: boolean;
  /** How compliance is verified in code */
  source: "signature" | "fsbo_declaration" | "fsbo_contracts" | "bnhub_publish_gates" | "legal_agreement_table";
};

/**
 * Declarative rules: which forms apply before which action.
 */
export function getRequiredForms(action: LegalActionContext): LegalFormRequirement[] {
  switch (action.context) {
    case "seller_listing":
      return [
        {
          key: LEGAL_FORM_KEYS.SELLER_DECLARATION,
          label: "Seller declaration (property disclosure)",
          mandatory: true,
          source: "fsbo_declaration",
        },
        {
          key: LEGAL_FORM_KEYS.SELLER_AGREEMENT,
          label: "Seller listing agreement",
          mandatory: true,
          source: "fsbo_contracts",
        },
        {
          key: LEGAL_FORM_KEYS.PLATFORM_TERMS,
          label: "Platform marketplace terms",
          mandatory: true,
          source: "fsbo_contracts",
        },
      ];
    case "buyer_offer":
    case "buyer_contact":
      return [
        {
          key: LEGAL_FORM_KEYS.BUYER_ACKNOWLEDGMENT,
          label: "Buyer acknowledgment (informed decision & limitations)",
          mandatory: true,
          source: "signature",
        },
      ];
    case "mortgage_request":
      return [
        {
          key: LEGAL_FORM_KEYS.MORTGAGE_DISCLOSURE,
          label: "Mortgage disclosure (estimates not guaranteed)",
          mandatory: true,
          source: "signature",
        },
      ];
    case "broker_activity":
      return [
        {
          key: LEGAL_FORM_KEYS.BROKER_AGREEMENT,
          label: "Broker platform agreement (commission & conduct)",
          mandatory: true,
          source: "legal_agreement_table",
        },
      ];
    case "rental_long":
      return [
        {
          key: LEGAL_FORM_KEYS.RENTAL_AGREEMENT,
          label: "Long-term rental agreement (contract)",
          mandatory: true,
          source: "bnhub_publish_gates",
        },
        {
          key: LEGAL_FORM_KEYS.PLATFORM_TERMS,
          label: "Platform terms",
          mandatory: true,
          source: "bnhub_publish_gates",
        },
      ];
    case "rental_short_publish":
      return [
        {
          key: LEGAL_FORM_KEYS.HOST_AGREEMENT,
          label: "Host agreement",
          mandatory: true,
          source: "bnhub_publish_gates",
        },
      ];
    case "rental_short_booking":
      return [
        {
          key: LEGAL_FORM_KEYS.GUEST_ACKNOWLEDGMENT,
          label: "Guest acknowledgment (house rules & safety)",
          mandatory: true,
          source: "signature",
        },
      ];
    case "tenant_confirmation":
      return [
        {
          key: LEGAL_FORM_KEYS.TENANT_ACKNOWLEDGMENT,
          label: "Tenant acknowledgment (condition & rent terms)",
          mandatory: true,
          source: "signature",
        },
      ];
  }
}

/**
 * Pre-resolved booleans from DB / listing state. Extend as hubs grow.
 */
export type ComplianceSnapshot = {
  /** `LegalFormSignature` rows keyed by `${formKey}|${contextType}|${contextId}` */
  signedFormKeys: Set<string>;
  /** FSBO seller declaration complete */
  fsboSellerDeclarationComplete?: boolean;
  /** FSBO seller agreement + platform terms contracts signed */
  fsboSellerContractsComplete?: boolean;
  /** BNHUB short-term publish gates (host + seller agreements, disclosure, etc.) */
  bnhubShortTermPublishAllowed?: boolean;
  /** Long-term rental: use BNHUB listing gates when wired */
  bnhubLongTermPublishAllowed?: boolean;
  /** `LegalAgreement` broker_terms for hub broker */
  brokerPlatformAgreementAccepted?: boolean;
};

function signatureKey(formKey: string, contextType: string, contextId: string): string {
  return `${formKey}|${contextType}|${contextId}`;
}

function hasSignature(snap: ComplianceSnapshot, formKey: LegalFormKey, contextType: string, contextId: string): boolean {
  return snap.signedFormKeys.has(signatureKey(formKey, contextType, contextId));
}

/**
 * Pure validation given a loaded snapshot (used by APIs and tests).
 */
export function validateForms(action: LegalActionContext, snap: ComplianceSnapshot): {
  ok: boolean;
  missing: LegalFormRequirement[];
  blockingReasons: string[];
} {
  if (legalEnforcementDisabled()) {
    return { ok: true, missing: [], blockingReasons: [] };
  }

  const required = getRequiredForms(action);
  const missing: LegalFormRequirement[] = [];
  const blockingReasons: string[] = [];

  for (const req of required) {
    if (!req.mandatory) continue;

    let satisfied = false;
    switch (req.source) {
      case "signature": {
        if (req.key === LEGAL_FORM_KEYS.BUYER_ACKNOWLEDGMENT) {
          satisfied = hasSignature(snap, LEGAL_FORM_KEYS.BUYER_ACKNOWLEDGMENT, "buyer_hub", "");
        } else if (req.key === LEGAL_FORM_KEYS.MORTGAGE_DISCLOSURE) {
          satisfied = hasSignature(snap, LEGAL_FORM_KEYS.MORTGAGE_DISCLOSURE, "mortgage_hub", "");
        } else if (req.key === LEGAL_FORM_KEYS.GUEST_ACKNOWLEDGMENT && action.context === "rental_short_booking") {
          satisfied = hasSignature(snap, LEGAL_FORM_KEYS.GUEST_ACKNOWLEDGMENT, "short_term_booking", action.listingId);
        } else if (req.key === LEGAL_FORM_KEYS.TENANT_ACKNOWLEDGMENT && action.context === "tenant_confirmation") {
          satisfied = hasSignature(snap, LEGAL_FORM_KEYS.TENANT_ACKNOWLEDGMENT, "tenant_flow", action.listingId);
        }
        break;
      }
      case "fsbo_declaration":
        satisfied = Boolean(snap.fsboSellerDeclarationComplete);
        break;
      case "fsbo_contracts":
        satisfied = Boolean(snap.fsboSellerContractsComplete);
        break;
      case "bnhub_publish_gates":
        if (action.context === "rental_long") {
          satisfied = Boolean(snap.bnhubLongTermPublishAllowed);
        } else if (req.key === LEGAL_FORM_KEYS.HOST_AGREEMENT && action.context === "rental_short_publish") {
          satisfied = Boolean(snap.bnhubShortTermPublishAllowed);
        }
        break;
      case "legal_agreement_table":
        satisfied = Boolean(snap.brokerPlatformAgreementAccepted);
        break;
      default:
        satisfied = false;
    }

    if (!satisfied) {
      missing.push(req);
      blockingReasons.push(`Missing or incomplete: ${req.label}`);
    }
  }

  return { ok: missing.length === 0, missing, blockingReasons };
}

export function isActionAllowed(result: ReturnType<typeof validateForms>): boolean {
  return result.ok;
}
