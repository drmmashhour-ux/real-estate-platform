/**
 * Field-level validation for parsed legal records — deterministic, no side effects.
 */

import type { LegalRecordType, LegalValidationResult } from "./legal-record.types";

export type LegalRecordValidateInput = {
  recordType: LegalRecordType;
  parsedData: Record<string, unknown>;
};

function currentYear(): number {
  return new Date().getFullYear();
}

export function validateLegalRecord(input: LegalRecordValidateInput): LegalValidationResult {
  const missingFields: string[] = [];
  const inconsistentFields: string[] = [];
  const warnings: string[] = [];

  try {
    const { recordType, parsedData } = input;
    const mk = parsedData._missingKeys;
    if (Array.isArray(mk)) {
      for (const k of mk) {
        if (typeof k === "string" && k.trim()) missingFields.push(k);
      }
    }

    const addMissing = (key: string, present: boolean) => {
      if (!present && !missingFields.includes(key)) missingFields.push(key);
    };

    switch (recordType) {
      case "seller_declaration": {
        addMissing("hasKnownDefects", typeof parsedData.hasKnownDefects === "boolean");
        addMissing("yearBuilt", typeof parsedData.yearBuilt === "number");
        addMissing("occupancyStatus", typeof parsedData.occupancyStatus === "string");
        const y = parsedData.yearBuilt;
        if (typeof y === "number") {
          if (y < 1800 || y > currentYear() + 1) {
            inconsistentFields.push("yearBuilt");
            warnings.push(`yearBuilt ${y} is outside the allowed numeric range for this schema.`);
          }
        }
        break;
      }
      case "lease_agreement": {
        addMissing("landlordName", typeof parsedData.landlordName === "string");
        addMissing("tenantName", typeof parsedData.tenantName === "string");
        addMissing("startDate", typeof parsedData.startDate === "string");
        addMissing("endDate", typeof parsedData.endDate === "string");
        const sd = parsedData.startDate;
        const ed = parsedData.endDate;
        if (typeof sd === "string" && typeof ed === "string") {
          const a = Date.parse(sd);
          const b = Date.parse(ed);
          if (!Number.isNaN(a) && !Number.isNaN(b) && b < a) {
            inconsistentFields.push("dateRange");
            warnings.push("Lease end date precedes start date in supplied fields.");
          }
        }
        break;
      }
      case "offer_to_purchase": {
        addMissing("offerAmountCents", typeof parsedData.offerAmountCents === "number");
        addMissing("acceptanceDeadline", typeof parsedData.acceptanceDeadline === "string");
        const cents = parsedData.offerAmountCents;
        if (typeof cents === "number" && (cents <= 0 || cents > Number.MAX_SAFE_INTEGER)) {
          inconsistentFields.push("offerAmountCents");
          warnings.push("Offer amount is not a positive bounded value.");
        }
        break;
      }
      case "identity_document": {
        addMissing("documentNumber", typeof parsedData.documentNumber === "string");
        addMissing("issuerCountry", typeof parsedData.issuerCountry === "string");
        addMissing("expiryDate", typeof parsedData.expiryDate === "string");
        const exp = parsedData.expiryDate;
        if (typeof exp === "string") {
          const t = Date.parse(exp);
          if (!Number.isNaN(t)) {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            if (t < today.getTime()) warnings.push("Identity document expiry date is in the past in supplied fields.");
          }
        }
        break;
      }
      case "proof_of_ownership": {
        addMissing("parcelId", typeof parsedData.parcelId === "string");
        addMissing("ownerNameDeclared", typeof parsedData.ownerNameDeclared === "string");
        break;
      }
      case "compliance_document": {
        addMissing("certificateType", typeof parsedData.certificateType === "string");
        addMissing("issueDate", typeof parsedData.issueDate === "string");
        break;
      }
      default:
        warnings.push("Unknown record type — validation is limited.");
    }

    const isValid = missingFields.length === 0 && inconsistentFields.length === 0;

    return { isValid, missingFields, inconsistentFields, warnings };
  } catch {
    return {
      isValid: false,
      missingFields: ["validation_error"],
      inconsistentFields: [],
      warnings: ["Validation produced a fallback result — treat as incomplete."],
    };
  }
}
