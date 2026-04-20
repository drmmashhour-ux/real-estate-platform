/**
 * Deterministic Québec compliance evaluation — no throws, no side effects.
 */

import { mergeQuebecComplianceChecklists } from "./quebec-compliance.checklist";
import type {
  QuebecComplianceChecklistResult,
  QuebecComplianceCheckResult,
  QuebecComplianceDomain,
  QuebecComplianceItem,
} from "./quebec-compliance.types";
import type {
  LegalRecordValidationBundleV1,
  LegalRuleResult,
  LegalValidationResult,
} from "../records/legal-record.types";
import type { LegalFraudOperationalIndicator } from "../legal-fraud-engine.service";

export type QuebecListingEvalInput = {
  id: string;
  country?: string | null;
  region?: string | null;
  priceCents?: number | null;
  propertyType?: string | null;
  address?: string | null;
  city?: string | null;
  listingOwnerType?: string | null;
  listingDealType?: string | null;
  sellerDeclarationJson?: unknown;
  sellerDeclarationCompletedAt?: Date | null;
  legalAccuracyAcceptedAt?: Date | null;
  moderationStatus?: string | null;
  /** FsboListingDocument-like */
  ownershipDocStatus?: string | null;
  idProofDocStatus?: string | null;
  verificationIdentityStage?: string | null;
};

export type QuebecComplianceEvaluatorInput = {
  primaryDomain?: QuebecComplianceDomain;
  domains: QuebecComplianceDomain[];
  listing: QuebecListingEvalInput;
  legalRecords?: Array<{
    recordType: string;
    status: string;
    parsedData?: Record<string, unknown> | null;
    validation?: LegalRecordValidationBundleV1 | null;
  }>;
  /** Aggregated validation from legal records when present */
  validationAggregate?: LegalValidationResult | null;
  ruleResults?: LegalRuleResult[] | null;
  fraudIndicators?: LegalFraudOperationalIndicator[] | null;
  /** From legal intelligence summary */
  legalIntelCriticalCount?: number;
  legalIntelWarningCount?: number;
  brokerLicenseVerified?: boolean;
  tenantIdPresent?: boolean;
  listingCodePresent?: boolean;
  /** Heuristic: document slots rejected repeatedly */
  documentRejectionLoop?: boolean;
};

function clampScore(n: number): number {
  return Math.min(100, Math.max(0, n));
}

function isPlaceholderAddress(a: string | null | undefined, c: string | null | undefined): boolean {
  const addr = (a ?? "").trim().toUpperCase();
  const city = (c ?? "").trim().toUpperCase();
  return addr === "TBD" || addr.length < 3 || city === "TBD" || city.length < 2;
}

function sellerDeclarationHasRentHints(json: unknown): boolean {
  try {
    if (!json || typeof json !== "object") return false;
    const o = json as Record<string, unknown>;
    const keys = ["rentAmount", "leaseEnd", "tenantOccupied", "rentalIncome", "longTermRental"];
    return keys.some((k) => o[k] != null && String(o[k]).trim() !== "");
  } catch {
    return false;
  }
}

function sellerDeclarationStrHints(json: unknown): { registration: boolean; auth: boolean; capacity: boolean } {
  try {
    if (!json || typeof json !== "object") return { registration: false, auth: false, capacity: false };
    const o = json as Record<string, unknown>;
    const reg =
      typeof o.strRegistrationNumber === "string" && o.strRegistrationNumber.trim().length > 0;
    const auth =
      typeof o.localShortTermAuthorization === "string" && o.localShortTermAuthorization.trim().length > 0;
    const cap =
      typeof o.maxGuests === "number" ||
      (typeof o.maxGuests === "string" && String(o.maxGuests).trim() !== "");
    return { registration: reg, auth: auth, capacity: cap };
  } catch {
    return { registration: false, auth: false, capacity: false };
  }
}

function evaluateOne(
  item: QuebecComplianceItem,
  ctx: QuebecComplianceEvaluatorInput,
): QuebecComplianceCheckResult {
  const base = (passed: boolean, msg: string, evidenceFound: boolean): QuebecComplianceCheckResult => ({
    itemId: item.id,
    passed,
    severity: item.severity,
    message: msg,
    evidenceFound,
  });

  try {
    const L = ctx.listing;
    const records = ctx.legalRecords ?? [];
    const proofOwnership = records.some(
      (r) => r.recordType === "proof_of_ownership" && r.status === "validated",
    );
    const ownershipSlotOk =
      ["uploaded", "pending_review", "approved"].includes(ctx.listing.ownershipDocStatus ?? "") ||
      proofOwnership;

    switch (item.id) {
      case "qc_listing_ownership_proof_present":
        return base(
          ownershipSlotOk,
          ownershipSlotOk
            ? "Ownership documentation is present or validated."
            : "Ownership documentation is missing or requires verification.",
          ownershipSlotOk,
        );
      case "qc_listing_seller_declaration_complete": {
        const complete = Boolean(L.sellerDeclarationCompletedAt) && L.sellerDeclarationJson != null;
        return base(
          complete,
          complete
            ? "Seller declaration is marked complete."
            : "Seller declaration must be completed before publishing.",
          complete,
        );
      }
      case "qc_listing_property_basic_data_present": {
        const priceOk = typeof L.priceCents === "number" && L.priceCents > 0;
        const typeOk = typeof L.propertyType === "string" && L.propertyType.trim().length > 0;
        const addrOk = !isPlaceholderAddress(L.address, L.city);
        const ok = priceOk && typeOk && addrOk;
        return base(
          ok,
          ok
            ? "Core listing facts are present."
            : "Price, property type, and address must be completed (non-placeholder).",
          ok,
        );
      }
      case "qc_listing_no_internal_conflicts_in_declaration": {
        let inconsistent = false;
        for (const r of records) {
          const v = r.validation?.validation;
          if (v?.inconsistentFields?.length) inconsistent = true;
        }
        if (ctx.validationAggregate?.inconsistentFields?.length) inconsistent = true;
        const passed = !inconsistent;
        return base(
          passed,
          passed
            ? "No inconsistent structured declaration markers detected."
            : "Structured declaration fields show inconsistencies — verification required.",
          passed,
        );
      }
      case "qc_listing_required_disclosures_present": {
        const ok = Boolean(L.legalAccuracyAcceptedAt);
        return base(
          ok,
          ok
            ? "Mandatory acknowledgement captured."
            : "Mandatory disclosure acknowledgement is not recorded — complete before publishing when prompted.",
          ok,
        );
      }
      case "qc_broker_license_reference_present": {
        const brokerFlow = L.listingOwnerType === "BROKER";
        if (!brokerFlow) return base(true, "Not applicable — broker licence check skipped.", true);
        const ok = ctx.brokerLicenseVerified === true;
        return base(
          ok,
          ok
            ? "Broker licence verification is satisfied."
            : "Broker licence verification is required for broker-managed listings.",
          ok,
        );
      }
      case "qc_broker_brokerage_identification_present": {
        const brokerFlow = L.listingOwnerType === "BROKER";
        if (!brokerFlow) return base(true, "Not applicable.", true);
        const ok = ctx.tenantIdPresent === true || ctx.listingCodePresent === true;
        return base(
          ok,
          ok
            ? "Brokerage identification context is present."
            : "Brokerage identification context should be associated with the listing.",
          ok,
        );
      }
      case "qc_landlord_lease_terms_present": {
        const rent =
          L.listingDealType?.includes("RENT") ||
          L.listingDealType?.includes("LEASE") ||
          sellerDeclarationHasRentHints(L.sellerDeclarationJson);
        if (!rent) return base(true, "Not applicable — long-term rental checks skipped.", true);
        const leaseDoc = records.some((r) => r.recordType === "lease_agreement" && r.status !== "rejected");
        const hint = sellerDeclarationHasRentHints(L.sellerDeclarationJson);
        const ok = leaseDoc || hint;
        return base(
          ok,
          ok
            ? "Lease or rental terms are represented."
            : "Lease terms must be represented for rental listings.",
          ok,
        );
      }
      case "qc_landlord_rental_conditions_defined": {
        const rent =
          L.listingDealType?.includes("RENT") ||
          L.listingDealType?.includes("LEASE") ||
          sellerDeclarationHasRentHints(L.sellerDeclarationJson);
        if (!rent) return base(true, "Not applicable.", true);
        const j = L.sellerDeclarationJson;
        let ok = false;
        try {
          if (j && typeof j === "object") {
            const o = j as Record<string, unknown>;
            ok = typeof o.rentalConditions === "string" && o.rentalConditions.trim().length > 8;
          }
        } catch {
          ok = false;
        }
        return base(
          ok,
          ok
            ? "Rental operating conditions are described."
            : "Rental operating conditions should be described.",
          ok,
        );
      }
      case "qc_str_registration_number_present":
      case "qc_str_local_authorization_present":
      case "qc_str_capacity_limits_defined": {
        const str =
          L.listingDealType?.includes("SHORT") ||
          L.listingDealType?.includes("BNHUB") ||
          L.listingDealType?.includes("STAY");
        if (!str) return base(true, "Not applicable — short-term rental checks skipped.", true);
        const hints = sellerDeclarationStrHints(L.sellerDeclarationJson);
        if (item.id === "qc_str_registration_number_present") {
          const ok = hints.registration;
          return base(
            ok,
            ok
              ? "Short-term registration identifier is present."
              : "Short-term registration identifier is missing or requires verification.",
            ok,
          );
        }
        if (item.id === "qc_str_local_authorization_present") {
          const ok = hints.auth;
          return base(
            ok,
            ok
              ? "Local authorization posture is indicated."
              : "Local authorization posture must be indicated for short-term listings.",
            ok,
          );
        }
        const ok = hints.capacity;
        return base(
          ok,
          ok
            ? "Occupancy limits are defined."
            : "Occupancy limits should be defined for short-term listings.",
          ok,
        );
      }
      case "qc_general_identity_document_verified": {
        const slotOk = ["uploaded", "pending_review", "approved"].includes(ctx.listing.idProofDocStatus ?? "");
        const verified =
          ctx.listing.verificationIdentityStage === "VERIFIED" ||
          ctx.listing.verificationIdentityStage === "APPROVED";
        const ok = slotOk || verified;
        return base(
          ok,
          ok
            ? "Identity verification requirements are satisfied."
            : "Identity verification is incomplete — verification required.",
          ok,
        );
      }
      case "qc_general_no_high_risk_legal_indicators": {
        const crit = ctx.legalIntelCriticalCount ?? 0;
        const fraudCrit = (ctx.fraudIndicators ?? []).filter((i) => i.severity === "critical").length;
        const ruleCrit = (ctx.ruleResults ?? []).filter((r) => r.severity === "critical").length;
        const bad = crit > 0 || fraudCrit > 0 || ruleCrit > 0;
        const passed = !bad;
        return base(
          passed,
          passed
            ? "No elevated operational compliance markers detected."
            : "Operational compliance markers require review before publication.",
          passed,
        );
      }
      case "qc_general_no_unresolved_rejection_loops": {
        const loop = ctx.documentRejectionLoop === true;
        const passed = !loop;
        return base(
          passed,
          passed
            ? "Document review does not show an unresolved rejection loop pattern."
            : "Document review requires resolution — verification required.",
          !loop,
        );
      }
      default:
        return base(true, "Check skipped — unknown item id (safe default).", false);
    }
  } catch {
    return base(false, "Compliance check produced a safe fallback — verification required.", false);
  }
}

export function evaluateQuebecCompliance(input: QuebecComplianceEvaluatorInput): QuebecComplianceChecklistResult {
  try {
    const items = mergeQuebecComplianceChecklists(input.domains);
    const results: QuebecComplianceCheckResult[] = [];
    for (const item of items) {
      results.push(evaluateOne(item, input));
    }

    let score = 100;
    const blockingIssues: string[] = [];
    const warnings: string[] = [];

    for (let i = 0; i < items.length; i++) {
      const item = items[i]!;
      const res = results[i]!;
      if (res.passed) continue;
      if (item.severity === "critical") score -= 25;
      else if (item.severity === "warning") score -= 5;
      else score -= 2;
      if (item.blocking && !res.passed) blockingIssues.push(item.id);
      if (!item.blocking && !res.passed) warnings.push(item.id);
    }

    score = clampScore(score);

    const domain = input.primaryDomain ?? input.domains[0] ?? "listing";

    return {
      domain,
      items,
      results,
      readinessScore: score,
      blockingIssues: [...new Set(blockingIssues)].sort(),
      warnings: [...new Set(warnings)].sort(),
    };
  } catch {
    return {
      domain: "listing",
      items: [],
      results: [],
      readinessScore: 0,
      blockingIssues: ["qc_evaluator_fallback"],
      warnings: [],
    };
  }
}
