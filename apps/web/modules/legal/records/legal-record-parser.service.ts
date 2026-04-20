/**
 * Deterministic, schema-driven normalization of structured legal record payloads.
 * No OCR or inference — only reads known keys from input JSON.
 */

import type { LegalRecordType } from "./legal-record.types";

export type LegalRecordParseInput = {
  recordType: LegalRecordType;
  /** Pre-extracted structured fields (upstream) or empty object. */
  structuredInput?: Record<string, unknown> | null;
};

function takeBool(v: unknown): boolean | null {
  if (typeof v === "boolean") return v;
  if (v === "true") return true;
  if (v === "false") return false;
  return null;
}

function takeNum(v: unknown): number | null {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string" && v.trim() !== "") {
    const n = Number(v);
    if (Number.isFinite(n)) return n;
  }
  return null;
}

function takeStr(v: unknown): string | null {
  if (typeof v === "string") return v.trim() === "" ? null : v.trim();
  return null;
}

function mergeNotes(parsed: Record<string, unknown>, key: string): void {
  const cur = parsed._missingKeys;
  const arr = Array.isArray(cur) ? [...cur] : [];
  if (!arr.includes(key)) arr.push(key);
  parsed._missingKeys = arr;
}

/**
 * Returns normalized `parsedData` — unknown keys from input are ignored per schema branch.
 */
export function parseLegalRecord(input: LegalRecordParseInput): Record<string, unknown> {
  try {
    const src = input.structuredInput && typeof input.structuredInput === "object" ? input.structuredInput : {};
    const out: Record<string, unknown> = {};

    switch (input.recordType) {
      case "seller_declaration": {
        const hasKnownDefects = takeBool(src.hasKnownDefects ?? src.has_known_defects);
        const yearBuilt = takeNum(src.yearBuilt ?? src.year_built);
        const occupancyStatus = takeStr(src.occupancyStatus ?? src.occupancy_status);
        out.recordType = input.recordType;
        out.hasKnownDefects = hasKnownDefects;
        out.yearBuilt = yearBuilt;
        out.occupancyStatus = occupancyStatus;
        if (hasKnownDefects === null) mergeNotes(out, "hasKnownDefects");
        if (yearBuilt === null) mergeNotes(out, "yearBuilt");
        if (occupancyStatus === null) mergeNotes(out, "occupancyStatus");
        break;
      }
      case "lease_agreement": {
        out.recordType = input.recordType;
        out.landlordName = takeStr(src.landlordName ?? src.landlord_name);
        out.tenantName = takeStr(src.tenantName ?? src.tenant_name);
        out.startDate = takeStr(src.startDate ?? src.start_date);
        out.endDate = takeStr(src.endDate ?? src.end_date);
        if (out.landlordName == null) mergeNotes(out, "landlordName");
        if (out.tenantName == null) mergeNotes(out, "tenantName");
        if (out.startDate == null) mergeNotes(out, "startDate");
        if (out.endDate == null) mergeNotes(out, "endDate");
        break;
      }
      case "offer_to_purchase": {
        out.recordType = input.recordType;
        out.offerAmountCents = takeNum(src.offerAmountCents ?? src.offer_amount_cents);
        out.acceptanceDeadline = takeStr(src.acceptanceDeadline ?? src.acceptance_deadline);
        if (out.offerAmountCents == null) mergeNotes(out, "offerAmountCents");
        if (out.acceptanceDeadline == null) mergeNotes(out, "acceptanceDeadline");
        break;
      }
      case "identity_document": {
        out.recordType = input.recordType;
        out.documentNumber = takeStr(src.documentNumber ?? src.document_number);
        out.issuerCountry = takeStr(src.issuerCountry ?? src.issuer_country);
        out.expiryDate = takeStr(src.expiryDate ?? src.expiry_date);
        if (out.documentNumber == null) mergeNotes(out, "documentNumber");
        if (out.issuerCountry == null) mergeNotes(out, "issuerCountry");
        if (out.expiryDate == null) mergeNotes(out, "expiryDate");
        break;
      }
      case "proof_of_ownership": {
        out.recordType = input.recordType;
        out.parcelId = takeStr(src.parcelId ?? src.parcel_id);
        out.ownerNameDeclared = takeStr(src.ownerNameDeclared ?? src.owner_name_declared);
        if (out.parcelId == null) mergeNotes(out, "parcelId");
        if (out.ownerNameDeclared == null) mergeNotes(out, "ownerNameDeclared");
        break;
      }
      case "compliance_document": {
        out.recordType = input.recordType;
        out.certificateType = takeStr(src.certificateType ?? src.certificate_type);
        out.issueDate = takeStr(src.issueDate ?? src.issue_date);
        if (out.certificateType == null) mergeNotes(out, "certificateType");
        if (out.issueDate == null) mergeNotes(out, "issueDate");
        break;
      }
      default: {
        out.recordType = input.recordType;
        out._parseNote = "unknown_record_type_branch";
      }
    }

    return out;
  } catch {
    return { recordType: input.recordType, _parseNote: "parse_fallback" };
  }
}
